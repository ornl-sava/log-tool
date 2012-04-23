/*jslint  node: true, white: true */
/*jshint  node: true, indent: 2, globalstrict: true, asi: true */

/* 
    read from a log file, convert to JSON, and emit new records
*/

'use strict';

/*  
    Import node-envy environment properties loader
    @see https://github.com/eliOcs/node-envy
    @requires
*/
var envy = require('envy')

/*  
    Import log-parser module
    @requires
*/
var parser = require('log-parser')


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
        

// configuration file (relative to the bin or lib directory)
var configFile = '__dirname/../config/config.json'

// the log file to watch, an array of Objects {log: filename, parser: parseString}
var targetLogs = []
    


// Export version
var version = module.exports.version = require('../package.json').version
// Title of process in ps
process.title = 'log-tool'


/*
  Read configuration from config file and set parameters
  Set NODE_ENV on command line or use default in config file
*/
module.exports.init = function () {
  console.log('Initializing ' + process.title + ' (version: ' + version + ')')
  envy.load(configFile)
  
  // connect to the event queue
  if (envy.config.eventQueueServerType === 'redis') {
    console.log('Connecting to Redis')
    redisClient = redis.createClient(envy.config.eventQueueServerPort, envy.config.eventQueueServerAddress);      
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

  var record = "[**] [1:2100538:17] GPL NETBIOS SMB IPC$ unicode share access [**]\n"
/*

"[**] [1:2100538:17] GPL NETBIOS SMB IPC$ unicode share access [**]\
[Classification: Generic Protocol Command Decode] [Priority: 3]\
04/05-17:55:00.933206 172.23.1.101:1101 -> 172.23.0.10:139\
TCP TTL:128 TOS:0x0 ID:1643 IpLen:20 DgmLen:122 DF\
***AP*** Seq: 0xCEF93F32  Ack: 0xC40C0BB  Win: 0xFC9C  TcpLen: 20
"

*/

  parser.convert(record)
}

/* 
  Stop the application
*/
module.exports.stop = function () {
  console.log('Stopping')
  redisClient.end()
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


