/*jslint  node: true, white: true */
/*jshint  node: true, indent: 2, globalstrict: true, asi: true, laxcomma: true */

/* 
    read from a log file, convert to JSON, and emit new records
*/

'use strict';

/*
    Node modules
*/
var path = require('path')
var fs = require('fs')
var util = require('util')

/*  
    Import event parser module
    @requires
*/
var eventParser = require(__dirname + '/parser')


/*  
    Import node-envy environment properties loader
    @see https://github.com/eliOcs/node-envy
    @requires
*/
var envy = require('envy')

/*  
    Import async module
    @see https://github.com/caolan/async
    @requires
*/
var async = require('async')

/*  
    Import [redis](http://redis.io/) module
    @see https://github.com/mranney/node_redis
    @requires
*/
var redis = require('redis')
  , redisClient
        

// figure out the working directory
var dirs = process.cwd().split('/')
  , workingDir = dirs[dirs.length - 1]
  , basePath = (workingDir === 'bin' ? '..' : '.')
    
// configuration file (relative to the bin or lib directory)
var appConfigFile = basePath + '/config/config.json'

// the log file to watch, an array of Objects {log: filename, parser: parseString}
var logConfigFile = path.normalize(process.env.PWD + '/' + basePath + '/config/logs.json')

// the parsers directory
var parsersDir = path.normalize(process.env.PWD + '/' + basePath + '/parsers')

/*
    The log configuration closure, available functions: add(), get(), length()
    Each entry stores: 
      * {String} logFile The file path to the log
      * {RegExp} parser The regular expression parser for the log
      * {Array} labels The labels for matching items in the regular expression
      * {RegExp} delimiter The delimiter for what is defined as an event
*/
var logConfig = function () {
  var logs = []
  return {
    // add a configuration and return the index
    add: function (log, parserFile) {
      var parserConfig = require(parsersDir + '/' + parserFile)
        , parser = new RegExp(parserConfig.regex, (parserConfig.multiline ? 'm' : ''))
        , labels = parserConfig.labels
        , delimiter = new RegExp((parserConfig.delimiter ? parserConfig.delimiter : '\n'))
      return logs.push({'logFile': log, 'parser': parser, 'labels': labels, 'delimiter': delimiter})
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

// Export version from the package.json file
var version = module.exports.version = require('../package.json').version

// Set the title of the process in ps
process.title = 'log-tool'


/*
  Read configuration from config files
  Set NODE_ENV on command line or use default in the application config file
*/
module.exports.init = function () {
  console.info('Initializing ' + process.title + ' (version: ' + version + ')')
  
  // load application configuration
  console.info('Loading application configuration')
  envy.load(appConfigFile)
  console.info('Environment: ' + envy.config.env)
  
  // load configuration for log files
  console.info('Loading log file configuration')
  var logs = require(logConfigFile)
  for (var i = 0; i < logs.length; i++)
    logConfig.add(logs[i].logFilePath, logs[i].logParser)
  
  // connect to the event queue
  if (envy.config.eventQueueServerType === 'redis') {
    console.info('Connecting to Redis')
//    redisClient = redis.createClient(envy.config.eventQueueServerPort, envy.config.eventQueueServerAddress);      
  }
  else {
    console.warn('Only Redis is currently supported')
    process.exit(1)
  }
  
}


/*
  Start the application
*/
module.exports.start = function () {
  console.info('Starting')

  // process or watch the log files
  for (var i = 0; i < logConfig.length(); i++) {
    var config = logConfig.get(i)
    processLog(config.logFile, config.parser, config.labels, config.delimiter, false)
  }

}

/* 
  Stop the application
*/
module.exports.stop = function () {
  console.info('Stopping')
//  redisClient.end()
}  
  

/*
  Watch log file for changes and execute on each new record
  @param {String} file The log file to process
  @param {Object} parser The [RegExp](https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/RegExp) object to use
  @param {Array} labels The labels to give to the matched objects from the regular express
  @param {Boolean} watch Optional parameter to continuously watch a file (default: false)
*/
var processLog = function (file, parser, labels, delimiter, watch) {

  // function to process a 'line' (based on delimiter) of log file
  function parseLine(line, callback) {
    eventParser.parse(line, parser, labels, function (error, result) {
      if (error)
        callback(error)
      else 
        sendLogRecord(result)
    })
  }
  
  // function to call when there is a parse error
  function parseError(err) {
    if (err) console.error('Error parsing line ' + err)
  }
  
  // open a stream for the file
  if (watch) {
    //TODO watch for file changes
    // @see http://nodejs.org/docs/latest/api/fs.html#fs_fs_watch_filename_options_listener
  }
  else {
    var buffer = '' // buffer for a log event
    var logStream = fs.createReadStream(file)
    logStream.setEncoding('utf8')

    logStream.on('data', function (chunk) {
      buffer += chunk
      if (buffer.match(delimiter)) {
        var lines = buffer.split(delimiter)
        buffer = lines.pop(); // all except last
        async.forEach(lines, parseLine, parseError)
      }
    })

    logStream.on('end', function (data) {
      parseLine(buffer, parseError)
    })
    
    logStream.on('error', function (error) {
      console.error('Error reading log file ' + file + '\n' + error)
    })
  }
  
}


/*
  Send a log event to configured event queue
*/
var sendLogRecord = function (record) {
  if (envy.config.eventQueueServerType === 'redis')
    sendRedis(record)
}

/*
  Register this instance of the sensor with the configured event queue and get a universal unique ID for this sensor instance.
  @param {Function} callback The callback function to execute
*/
var registerSensor = function (callback) {
  console.info('registering sensor')
  callback(id)
  var err = null
  
  var id = 0 // simulate id
  callback(err, id)
}

/*
  Deregister this instance of the sensor with the configured event queue
  @param {Function} callback The callback function to execute
*/
var deregisterSensor = function (callback) {
  console.info('registering sensor')
  var err = null
  
  var id = 0 // simulate id
  callback(err, id)
}

/*
  Send a heartbeat to the configured event queue. Heartbeat packets include the host information.
*/
var sendHeartbeat = function () {
  
}

/*
  Send command to redis
*/
var sendRedis = function (command) {
  console.log('send to redis\n' + util.inspect(command) + '\n')
}


/*
  Gather host information
  @return {Object} hostInfo Host information: host name, operating system type, operating system platform, operating system release, CPU architecture, host CPU count, host memory, host uptime, host load average (1,5,15 minutes)
*/
var getHostInfo = function () {
  var hostInfo = {}
  return hostInfo
}


