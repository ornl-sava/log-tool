/*jslint  node: true, white: true */
/*jshint  node: true, indent: 2, globalstrict: true, asi: true */

/* 
    read from a log file, convert to JSON, and emit new records
*/

'use strict';

/*  
    Import filesystem core module
    @see http://nodejs.org/docs/latest/api/fs.html
    @requires
*/
var fs = require('fs')

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
//var async = require('async')

/*  
    Import underscore module
    @see http://documentcloud.github.com/underscore/
    @requires
*/
//var _ = require('underscore')

/*  
    Import [redis](http://redis.io/) module
    @see https://github.com/mranney/node_redis
    @requires
*/
var redis = require('redis'),
    redisClient

// configuration file (relative to the bin directory)
var configFile = '../config/config.json'

// the log file to watch, an array of Objects {log: filename, parser: parseString}
var targetLogs = []
    

/*
  Application to export
*/
var app = module.exports


/*
  Read configuration from config file and set parameters
  Set NODE_ENV on command line or use default in config file
*/
app.init = function () {
  console.log('Initializing')
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
app.start = function () {
  console.log('Starting')


}

/* 
  Stop the application
*/
app.stop = function () {
  console.log('Stopping')
  redisClient.end()
}  
  

/*
  Watch log file for changes and execute on each new record
*/
var watch = function () {
  
}

/*
  Parse a log record using configured parser and convert to json
*/
var convert = function () {
  
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
*/
var registerSensor = function () {
  
}

/*
  Deregister this instance of the sensor with the configured event queue
*/
var deregisterSensor = function () {
  
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
  
}


/*
  Gather host information
  @return {Object} hostInfo Host information: host name, operating system type, operating system platform, operating system release, CPU architecture, host CPU count, host memory, host uptime, host load average (1,5,15 minutes)
*/
var getHostInfo = function () {
  var hostInfo = {}
  return hostInfo
}


