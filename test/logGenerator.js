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

var lazy = require("lazy")

//TODO make option in config?
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
var copy = function (inFileName, outFileName) { 
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
var generate = function (inFileName, outFileName, logIndex, speedup) {
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
            if(addLineNumber)
              line = "Line Number: " + (i+1) + "," + line
            try{
              result = eventParser.parseSync(line, parser, labels, timeParser);
            }catch(err){
              console.error('error ' + err + '\nwith line ' + lines[0])
            }
            //console.log('started at: ' + firstTime + ' sleeping for: ' + (result.timestamp - firstTime) );
            writeLineDelay(line, (result.timestamp - firstTime)/speedup, o);
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

//for testing
generate("./data/firewall-vast12-2h.csv", "./tempData/firewall-vast12-2h.csv", 1, 10);
//generate("./data/ids-vast12-full", "./tempData/ids-vast12-full", 0, 10);
//generate("./data/ids-vast12", "./tempData/ids-vast12", 0, 10);
