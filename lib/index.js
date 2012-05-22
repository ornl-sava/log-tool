/* 
    read from a log file, convert to JSON, and emit new records
*/

'use strict';

/*
    Node modules
*/
var path = require('path')
  , fs = require('fs')
  , os = require('os')
  , util = require('util')

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
    Import lodash module - drop in replacement for underscore
    @see https://github.com/bestiejs/lodash
    @requires
*/
var _ = require('lodash')

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

// Export version from the package.json file
var version = module.exports.version = require('../package.json').version

// Set the title of the process in ps
process.title = require('../package.json').name

// Set the hostname, which  every event will be tagged with
var hostname = os.hostname()


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
    logConfig.add(logs[i])
  
  // connect to the event queue
  if (envy.config.eventQueueServerType === 'redis') {
    console.info('Connecting to Redis (persistent write)')
    redisClient = redis.createClient(envy.config.eventQueueServerPort, envy.config.eventQueueServerAddress);
    redisClient.on('error', function (error) {
      console.error('Redis Error: ' + error)
      process.exit(1)
    })
  }
  else if (envy.config.eventQueueServerType === 'redis-pubsub') {
    console.info('Connecting to Redis (publish/subscribe)')
    redisClient = redis.createClient(envy.config.eventQueueServerPort, envy.config.eventQueueServerAddress);
    redisClient.on('error', function (error) {
      console.error('Redis Error: ' + error)
      process.exit(1)
    })
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
  // TODO - should this be spawning off workers?
  for (var i = 0; i < logConfig.length(); i++) {
    processLog(logConfig.get(i), false)
  }

}

/* 
  Stop the application
*/
module.exports.stop = function () {
  console.info('Stopping')
  //redisClient.end()
}  
  

/*
  Watch log file for changes and execute on each new record
  @param {Object} cfg The configuration that includes the log file to process, the parser, the labels, the optional delimiter, the optional timestamp parser
  @param {Boolean} watch Optional parameter to continuously watch a file (default: false)
*/
var processLog = function (cfg, watch) {
  var name = cfg.name
    , file = cfg.file
    , parser = cfg.parser
    , labels = cfg.labels
    , delimiter = cfg.delimiter
    , timeParser = cfg.timeParser

  // function to process a 'line' (based on delimiter) of log file
  function parseLine(line, callback) {
    eventParser.parse(line, parser, labels, timeParser, function (error, result) {
      if (error)
        callback('Log error for ' + name + '\n' + error)
      // check for non-null results and send those
      sendLogRecord(_.extend(result, {'sensorType':name}))
    })
  }
  
  // function to call when there is a parse error
  function parseError(err) {
    if (err) console.error(err)
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
        buffer = lines.pop() // all except last
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
  @param {Object} event The JSON object representing the log event
*/
var sendLogRecord = function (event) {
  if (envy.config.eventQueueServerType === 'redis')
    sendRedis(event)
  else if (envy.config.eventQueueServerType === 'redis-pubsub')
    publishRedis(event)
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
  Send data to redis to persist in the database
  Data sent to redis:
    key-> sensorType:destip where ip is the destination ip (or only ip if not flow)
    value-> {timestamp: event}
  This assumes that for each sensor/ip pair there is only a single timestamp, which may not be the case. May have to have a sequencer or random number here.
  It may be useful instead to have timestamp as part of the key: sensor:destip:timestamp
  @param {Object} record The data to send to redis
*/
var sendRedis = function (record) {
  var key = record.sensorType + ':' + record.destIP
    , val = {}
  val[record.timestamp.toString()] = record
  console.log('send to redis: ' + key + '  ' + record.timestamp.toString())
  redisClient.hmset(key, val)
}

/*
  Publish data to redis using publish / subscribe
  @see http://redis.io/topics/pubsub
  @param {Object} record The data to send to redis
*/
var publishRedis = function (record) {
  var channel = 'events' // TODO - this should be configuration option
  console.log('publish to redis channel: ' + channel + ', message: ' + util.inspect(record))
  redisClient.publish(channel, JSON.stringify(record))
}


/*
  Gather host information
  @return {Object} hostInfo Host information: host name, operating system type, operating system platform, operating system release, CPU architecture, host CPU count, host memory, host uptime, host load average (1,5,15 minutes)
*/
var getHostInfo = function () {
  var hostInfo = {}
  return hostInfo
}


