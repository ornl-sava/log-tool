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

/*  
    Import event parser module
    @requires
*/
var eventParser = require('../lib/parser')
var parsersDir = '../parsers'

/*
    The log configuration closure, available functions: add(), get(), length()
    Each entry stores: 
      * {String} name The name to refer to this logging instance as
      * {String} file The file path to the log
      * {RegExp} parser The regular expression parser for the log
      * {Array} labels The labels for matching items in the regular expression
      * {RegExp} delimiter The delimiter for what is defined as an event
*/
var logConfig = function () {
  var logs = []
  return {
    // add a configuration and return the index
    add: function (cfg) {
      var parserConfig = require(parsersDir + '/' + cfg.logParser)
        , parser = new RegExp(parserConfig.regex, (parserConfig.multiline ? 'm' : ''))
        , labels = parserConfig.labels
        , delimiter = new RegExp((parserConfig.delimiter ? parserConfig.delimiter : '\n'))
        , timeParser = (parserConfig.timestamp ? parserConfig.timestamp : '')
      return logs.push({'name': cfg.logName, 'file': cfg.logFilePath, 'parser': parser, 'labels': labels, 'delimiter': delimiter, 'timeParser': timeParser})
    }
    // get the log configuration for a given index
  , get: function (index) {
      return logs[index]
    }
    // get the number of log configurations that are stored here
  , length: function () {
      return logs.length
    }
  }
}()

//kinda hacky, but apperantly this is the best node can do?
//TODO I find that hard to believe ... look into this further
function sleepSyn(milliSeconds) {
  var startTime = new Date().getTime();
  while (new Date().getTime() < startTime + milliSeconds);
}

function sleep(milliSeconds, cb) {
  setTimeout(cb, milliSeconds);
}

//copy the log (not in relative time)
var copy = function (inFileName, outFileName) { 
  //var logInStream = fs.createReadStream(inFileName)
  var o = fs.createWriteStream(outFileName);
  var i = rl.createInterface(fs.createReadStream(inFileName), o, null);
  i.on('line', function (line) {
    o.write(line, 'utf8')
    //console.log('Read: '+line);
  });
  i.on('close', function() {
    console.log('Done!');
    //process.stdin.destroy();
    //process.exit(0);
  });
}

var generate = function (inFileName, outFileName) {
  // load configuration for log files
  //console.info('Loading log file configuration')
  var logConfigFile = '../config/logs.json'
  var logs = require(logConfigFile)
  for (var i = 0; i < logs.length; i++)
    logConfig.add(logs[i])
  var logIndex = 1
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
      var result = eventParser.parseSync(lines[0], parser, labels, timeParser);
      var firstTime = result.timestamp;
      logStream.destroy(); //have all we need from this stream, will open a fresh one now.

      var o = fs.createWriteStream(outFileName);
      new lazy(fs.createReadStream(inFileName))
        .lines
        .forEach(function(line){
          //console.log("OMG " + line.toString());
          try{
            result = eventParser.parseSync(line, parser, labels, timeParser);
          }catch(err){
            console.error('Log error for ' + name + '\n' + err)
          }
          //console.log('started at: ' + firstTime + ' sleeping for: ' + (result.timestamp - firstTime) );
          sleep(result.timestamp - firstTime, function(){
            //firstTime = result.timestamp;
            o.write(line, 'utf8');
            //console.log('Read: '+line);
          });
        }
      );
/*
      //var logInStream = fs.createReadStream(inFileName)
      var o = fs.createWriteStream(outFileName);
      var i = rl.createInterface(fs.createReadStream(inFileName), o, null);
      i.on('line', function (line) {
        //TODO parse timestamp, wait before writing.
        try{
          result = eventParser.parseSync(line, parser, labels, timeParser);
        }catch(err){
          console.error('Log error for ' + name + '\n' + err)
        }
        // check for non-null results and send those
        //console.log( JSON.stringify(result) )
        //sleep(lastTime - result.timestamp);
        console.log('started at: ' + firstTime + ' sleeping for: ' + (firstTime - result.timestamp) );
        sleep(firstTime - result.timestamp, function(){
          //firstTime = result.timestamp;
          o.write(line, 'utf8');
          console.log('Read: '+line);
        });
      });
      i.on('close', function() {
        console.log('Done!');
        //process.stdin.destroy();
        //process.exit(0);
      });
*/

    }
  })
}


module.exports.generate = generate;
module.exports.sleepSyn = sleepSyn;
module.exports.sleep = sleep;

//for testing
generate("./data/firewall-vast12-fast.csv", "./tempData/firewall-vast12-fast.csv");
