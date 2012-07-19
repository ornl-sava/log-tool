var rl = require('readline');
var path = require('path')
  , fs = require('fs')
  , os = require('os')
  , util = require('util')

/*  
    Import lodash module - drop in replacement for underscore
    @see https://github.com/bestiejs/lodash
    @requires
*/
var _ = require('lodash')

var lazy = require("lazy") //TODO is this still in use?

// Import opts command line options parser module
//  https://bitbucket.org/mazzarelli/js-opts/wiki/Home
var opts = require('opts');

var common = require('../lib/common.js');

//TODO make option in config or opts?
var addLineNumber = true

/*  
    Import event parser module
    @requires
*/
var eventParser = require('../lib/parser')
//var parsersDir = '../parsers'

// figure out the working directory
var dirs = process.cwd().split('/')
  , workingDir = dirs[dirs.length - 1]
  , basePath = (workingDir === 'bin' || workingDir === 'test' ? '..' : '.')
    
// configuration file (relative to the bin or lib directory)
var appConfigFile = basePath + '/config/config.json'

// the log file to watch, an array of Objects {log: filename, parser: parseString}
var logConfigFile = path.normalize(process.env.PWD + '/' + basePath + '/config/logs.json')

// the parsers directory
var parsersDir = path.normalize(process.env.PWD + '/' + basePath + '/parsers')

/*
    The log configuration closure, available functions: add(), get(), length()
    Each entry stores: 
      * {String} name The name to refer to this logging instance as
      * {String} file The file path to the log
      * {RegExp} parser The regular expression parser for the log
      * {Array} labels The labels for matching items in the regular expression
      * {RegExp} delimiter The delimiter for what is defined as an event
*/
var logConfig = require('../lib/index').logConfig

function sleep(milliSeconds, cb) {
  setTimeout(cb, milliSeconds);
}

//copy the log (not in relative time)
//NB: if there are several lines with same timestamp, this will preserve line order, while generate() will not.
var copy = function (inFileName, outFileName, logIndex, startTime, startLine) { 
  var o = fs.createWriteStream(outFileName);
  var i = rl.createInterface(fs.createReadStream(inFileName), o, null);
  i.on('line', function (line) {
    o.write(line, 'utf8')
    //console.log('Read: '+line);
  });
  i.on('close', function() {
    console.log('Done with log copy!');
  });
}

//logIndex is the index of the needed entry in the logs.json file.
//currently, ids = 0, firewall = 1, but is subject to change.
//speedup is a mult., eg. 2 is double-speed, etc.
var generate = function (inFileName, outFileName, logIndex, speedup, startTime, startLine) {
  //console.log('Invoking generate with: ' + inFileName + ' ' + outFileName + ' ' + logIndex + ' ' + speedup + ' ' + startTime + ' ' + startLine);
  // load configuration for log files
  //console.info('Loading log file configuration')
  //var logConfigFile = '../config/logs.json'
  //var logConfigFile = path.normalize(process.env.PWD + '/' + basePath + '/config/logs.json')
  if(!speedup || speedup == 0)
    speedup = 1; //do this so default makes sense.
  var logs = require(logConfigFile)
  for (var i = 0; i < logs.length; i++)
    logConfig.add(logs[i])
  //var logIndex = 1 //TODO obv. this will only work with one log type (firewall) for now.
  var parser = logConfig.get(logIndex).parser;
  var labels = logConfig.get(logIndex).labels;
  var timeParser = logConfig.get(logIndex).timeParser;
  var delimiter = logConfig.get(logIndex).delimiter;
  var name = logConfig.get(logIndex).name;

  // open a stream for the file
  var buffer = '' // buffer for a log event
  var logStream = fs.createReadStream(inFileName)
  logStream.setEncoding('utf8')

  logStream.on('data', function (chunk) {
    buffer += chunk
    if (buffer.match(delimiter)) {
      var lines = buffer.split(delimiter)
      try{
        var result = eventParser.parseSync(lines[0], parser, labels, timeParser);
      }catch (err){
        console.error('error ' + err + '\nwith line ' + lines[0])
      }
      var firstTime = result.timestamp;
      //console.log('first line timestamp is: ' + firstTime );
      if( firstTime < startTime){
        //console.log('first line timestamp was: ' + firstTime + ' but now using startTime of: ' + startTime );
        firstTime = startTime;
      }
      logStream.destroy(); //have all we need from this stream, will open a fresh one now.

      var o = fs.createWriteStream(outFileName);
      /* incomplete / not working - read in chunks, wait for few ms in between.
      var buf = new Buffer(10000);
      fs.open(inFileName, 'r', function(err,fd){
        if(err) {
          console.error("File could not be opened: %s", err);
        }
        fs.read(fd, buf, null, 10000, function(err, bytesRead, buffer){
          //writeLineDelay(line, result.timestamp - firstTime, o);
          console.log(buffer.toString('utf8'));
        });
      });//end fs.open
      */
      // read the entire file before moving on.
      fs.readFile(inFileName, 'utf8', function (err, data) {
        if (err) throw err;
        console.log('File read completed, scheduling writes...');
        var lines = data.split(delimiter)
        var line
        for(var i=0; i< lines.length; i++){
          line = lines[i];
          if(line != ''){
            if( (i+1) >= startLine ){
              if( (i+1) === startLine )
                firstTime = line.timestamp;
              if(addLineNumber)
                line = "Line Number: " + (i+1) + "," + line
              try{
                result = eventParser.parseSync(line, parser, labels, timeParser);
              }catch(err){
                console.error('error ' + err + '\nwith line ' + lines[0])
              }
              //console.log('started at: ' + firstTime + ' sleeping for: ' + (result.timestamp - firstTime) );
              if(result.timestamp >= firstTime)
                writeLineDelay(line, (result.timestamp - firstTime)/speedup, o);
            }
          }
        }
      });
    }
  })
}

function writeLineDelay(line, delay, ws){
  sleep(delay, function(){
    //firstTime = result.timestamp;
    var status = ws.write(line + '\n', 'utf8');
    /*
    if( status === false)
      console.warn('Warning: line could not be written normally: ' + line);
    else
      console.debug('Line written ok!');
    //console.log('Read: '+line);
    */
  });
}

module.exports.generate = generate;
module.exports.sleep = sleep;

//for testing.  old.
//generate("./data/firewall-vast12-2h.csv", "./tempData/firewall-vast12-2h.csv", 1, 1);
//generate("./data/ids-vast12-full", "./tempData/ids-vast12-full", 0, 10);
//generate("./data/ids-vast12", "./tempData/ids-vast12", 0, 10);

//now with more usefulness!
// CONSTANTS and defaults
var APP_VERSION = '0.0.1';
var DEFAULT_DEBUG = false;
var DEFAULT_IN_FILE = "./data/firewall-slice2.csv"
var DEFAULT_OUT_FILE = "./tempData/firewall-slice2.csv"
var DEFAULT_INDEX = 1; //position in logs.json list
var DEFAULT_SPEED = 1;
var DEFAULT_START_TIME = 0;
var DEFAULT_START_LINE = 0;
var DEFAULT_INSTANT = false;

//TODO descriptions should not exceed 80 cols, or should have \n's added in logical places.
var options = [
  { short       : 'v'
  , long        : 'version'
  , description : 'Show version and exit'
  , callback    : function () { console.log(APP_VERSION); process.exit(1); }
  },
  { short       : 'd'
  , long        : 'debug'
  , description : 'Show debugging info  (default:  ' + (DEFAULT_DEBUG ? 'true' : 'false') + ')'
  , callback    : function (value) { common.logger.info('Set debug to ' + value); }
  },
  { short       : 'i'
  , long        : 'inFile'
  , description : 'Set location of input file (default:  ' + DEFAULT_IN_FILE + ')'
  , value       : true
  , callback    : function (value) {
        if ( path.existsSync(value) ) {
            common.logger.info('Using ' + value + ' for input file.');
        }
        else {
            common.logger.error('Input file ' + value + ' does not exist.');
            process.exit(1);
        }
    }
  },
  { short       : 'o'
  , long        : 'outFile'
  , description : 'Set location of output file (default:  ' + DEFAULT_OUT_FILE + ')'
  , value       : true
  , callback    : function (value) {
        if ( path.existsSync(value) ) {
            common.logger.info('Using ' + value + ' for output file.');
        }
        else {
            common.logger.error('Output file ' + value + ' does not exist.');
            process.exit(1);
        }
    }
  },

  { short       : 'p'
  , long        : 'logIndex'
  , description : 'Set the log index.  It must match the appropriate entry in the log config file. (default:  ' + DEFAULT_INDEX + ')'
  , value       : true
  , callback    : function (value) {
        if ( value >= 0 && value <= 1 ) { //TODO read index range from logs.json file
            common.logger.info('Using logIndex of ' + value);
        }
        else {
            common.logger.error('Invalid range for logIndex: ' + value);
            process.exit(1);
        }
    }
  },
  { short       : 's'
  , long        : 'speed'
  , description : 'Set speed ratio for generating the log file (default:  ' + DEFAULT_SPEED + 
                    ') Higher values are faster: 2 is double speed, 0.5 is half speed, etc.'
  , value       : true
  , callback    : function (value) {
        if ( value !== 0 ) {
            common.logger.info('Using speed of ' + value);
        }
        else {
            common.logger.error('Invalid value for speed: ' + value);
            process.exit(1);
        }
    }
  },
  { short       : 't'
  , long        : 'startTime'
  , description : 'Start time (epoch time in ms.)  This will ignore all log entries before this time. (default:  ' + DEFAULT_START_TIME + ')'
  , value       : true
  , callback    : function (value) {
        if ( value > 0 ) { //TODO some better checking against timestamps in log, after prog is invoked
            common.logger.info('Using startTime of ' + value);
        }
        else {
            common.logger.error('Invalid value for startTime: ' + value);
            process.exit(1);
        }
    }
  },
  { short       : 'l'
  , long        : 'startLine'
  , description : 'Start line.  This will ignore all log entries before this line. (default:  ' + DEFAULT_START_LINE + ')'
  , value       : true
  , callback    : function (value) {
        if ( value > 0 ) { //TODO some better checking against num lines in log, after prog is invoked
            common.logger.info('Using startLine of ' + value);
        }
        else {
            common.logger.error('Invalid value for startLine: ' + value);
            process.exit(1);
        }
    }
  },
  { short       : 'I'
  , long        : 'instant'
  , description : 'Output file instantly, instead of in relative time  (Default:  ' + DEFAULT_INSTANT + ')'
  , value       : true
  , callback    : function (value) {
        if ( value === false ) { 
            common.logger.info('Processing log file in relative time');
        }
        else {
            common.logger.info('Processing log file in fastest possible time');
        }
    }
  }
];

//TODO should be able to specify logs.json file location (once it is configurable in logtool.js)
//TODO mode to read from logs.json & guess what's needed??

opts.parse(options, true);

// these will be set by command line arguments
var debug     = opts.get('debug')     || DEFAULT_DEBUG;
var inFile    = opts.get('inFile')    || DEFAULT_IN_FILE;
var outFile   = opts.get('outFile')   || DEFAULT_OUT_FILE;
var logIndex  = opts.get('logIndex')  || DEFAULT_INDEX;
var speed     = opts.get('speed')     || DEFAULT_SPEED;
var startTime = opts.get('startTime') || DEFAULT_START_TIME; //TODO does nothing.
var startLine = opts.get('startLine') || DEFAULT_START_LINE; //TODO does nothing.
var instant   = opts.get('instant')   || DEFAULT_INSTANT; //TODO mode not supported.

if( !instant )
  generate(inFile, outFile, logIndex, speed, startTime, startLine);
else
  copy(inFile, outFile, logIndex, startTime, startLine);

