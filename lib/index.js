/*jslint  node: true, white: true */
/*jshint  node: true, indent: 2, globalstrict: true, asi: true */

/* 
    read from a log file, convert to JSON, and emit new records
*/

'use strict';

/*
    Node modules
*/
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
var redis = require('redis'),
    redisClient
        

// figure out the working directory
var dirs = process.cwd().split('/')
var workingDir = dirs[dirs.length - 1]
var basePath = (workingDir === 'bin' ? '..' : '.')
    
// configuration file (relative to the bin or lib directory)
var appConfigFile = basePath + '/config/config.json'

// the log file to watch, an array of Objects {log: filename, parser: parseString}
var logConfigFile = basePath + '/config/logs.json'



// Export version
var version = module.exports.version = require('../package.json').version

// Set the title of the process in ps
process.title = 'log-tool'


/*
  Read configuration from config file and set parameters
  Set NODE_ENV on command line or use default in config file
*/
module.exports.init = function () {
  console.log('Initializing ' + process.title + ' (version: ' + version + ')')
  
  // load application configuration
  envy.load(appConfigFile)
  console.log('Environment: ' + envy.config.env)
  
  // load log files
  var logs = require(process.env.PWD + '/' + logConfigFile)
  console.log(util.inspect(logs))
  
  // connect to the event queue
  if (envy.config.eventQueueServerType === 'redis') {
    console.log('Connecting to Redis')
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
  console.log('Starting')


  var re = new RegExp(
  "^\\[\\*\\*\\] \\[([0-9:]+)\\] ([\\S\\s]*) \\[\\*\\*\\]\\s*[\r\n|\r|\n]\\[Classification: ([\\S\\s]*)\\] \\[Priority: (\\d+)\\]\\s*[\r\n|\r|\n]([\\d\\/\\-:\\.]+) ([\\d\\.]+):(\\d+) \\-> ([\\d\\.]+):(\\d+)\\s*[\r\n|\r|\n]([\\s\\S]+)", 'm')
  var parser = {'regex': re, 'labels': ['rule', 'ruleText', 'classification', 'priority', 'timestamp', 'sourceIP', 'sourcePort', 'destIP', 'destPort', 'packetInfo']}

  // the record to use (snort)
  var record = "[**] [1:2100538:17] GPL NETBIOS SMB IPC$ unicode share access [**]\n[Classification: Generic Protocol Command Decode] [Priority: 3]\n04/05-17:55:00.933206 172.23.1.101:1101 -> 172.23.0.10:139\nTCP TTL:128 TOS:0x0 ID:1643 IpLen:20 DgmLen:122 DF\n***AP*** Seq: 0xCEF93F32  Ack: 0xC40C0BB  Win: 0xFC9C  TcpLen: 20"
  //console.log(record)


  eventParser.parse(record, parser, function (error, result) {
    if (error) {
      console.error(error)
    }
    else {
      console.log('\n' + util.inspect(result))
      
      // upload to redis
      // sendLogRecord(res)
    }

  })

}

/* 
  Stop the application
*/
module.exports.stop = function () {
  console.log('Stopping')
//  redisClient.end()
}  
  

/*
  Watch log file for changes and execute on each new record
*/
var watch = function () {
  
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
  console.log('registering sensor')
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
  console.log('registering sensor')
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
  console.log('send to redis: ' + command)
}


/*
  Gather host information
  @return {Object} hostInfo Host information: host name, operating system type, operating system platform, operating system release, CPU architecture, host CPU count, host memory, host uptime, host load average (1,5,15 minutes)
*/
var getHostInfo = function () {
  var hostInfo = {}
  return hostInfo
}


