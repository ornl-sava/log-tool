/* 
    read from a log file, convert to JSON, and emit new records
*/

'use strict'

var verbose = false

/*
    Node modules
*/
var path = require('path')
  , fs = require('fs')
  , os = require('os')
  , util = require('util')

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
  , basePath = (workingDir === 'bin' || workingDir === 'test' ? '..' : '.')
    
// configuration files (relative to the bin or lib directory)
var appConfigFile = path.normalize(process.env.PWD + '/' + basePath + '/config/global.json')
var inputConfigFile = path.normalize(process.env.PWD + '/' + basePath + '/config/input.json')
var outputConfigFile = path.normalize(process.env.PWD + '/' + basePath + '/config/output.json')
var parsersConfigFile = path.normalize(process.env.PWD + '/' + basePath + '/config/parsers.json')
var connectionConfigFile = path.normalize(process.env.PWD + '/' + basePath + '/config/connections.json')

// the parser modules directory
var parserDir = path.normalize(process.env.PWD + '/' + basePath + '/parsers')
// the input modules directory
var inputDir = path.normalize(process.env.PWD + '/' + basePath + '/input')
// the output modules directory
var outputDir = path.normalize(process.env.PWD + '/' + basePath + '/output')
// the core libs directory
var libsDir = path.normalize(process.env.PWD + '/' + basePath + '/lib')

// Export version from the package.json file
var version = module.exports.version = require('../package.json').version

// Set the title of the process in ps
process.title = require('../package.json').name

// Set the hostname, which every event will be tagged with
var hostname = os.hostname()

/*
  Start the application
*/
module.exports.start = function () {
  console.info('Reading configuration info...')
  var appConfig = JSON.parse(fs.readFileSync(appConfigFile, 'utf-8'))
  var inputConfig = JSON.parse(fs.readFileSync(inputConfigFile, 'utf-8'))
  var outputConfig = JSON.parse(fs.readFileSync(outputConfigFile, 'utf-8'))
  var parsersConfig = JSON.parse(fs.readFileSync(parsersConfigFile, 'utf-8'))
  var connectionConfig = JSON.parse(fs.readFileSync(connectionConfigFile, 'utf-8'))

  console.info('Configuring module instances...')
  //structs for storing pipes for named sources, destinations, parsers, by their names.
  var srcNames = {}
  var dstNames = {}
  var parserNames = {}

  for(var src in inputConfig){
    //we only need the module name, then pass the remaining values to the module's start method as its opts.
    var inputModule = require('../input/'+inputConfig['module']+'.js')
    srcNames[src] = inputModule.start(inputConfig)
  }

  var output_file = require('../output/file.js')
  var parser_null = require('../parsers/null.js')
  var es = require('event-stream')


  var output = output_file.start()
  //makes a 'synchronous through stream' - every time it gets a data event, it will call data & (typically) emit one of it own. No internal buffers.
  var parser = es.through(parser_null.data, parser_null.end)

  console.info('Starting logtool...')


  // TODO - the below should not assume all inputs connect to all outputs, should allow arbitrary connections
  // TODO - should this be spawning off workers for each of the above?
  for(var src in srcNames){
    //TODO double check this is ok for pause/resume, or else maybe use es.connect
    util.pump(parser, output)  //hook parser -> output
    util.pump(srcNames[src], parser)  //hook input -> parser
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
  Gather host information
  @return {Object} hostInfo Host information: host name, operating system type, operating system platform, operating system release, CPU architecture, host CPU count, host memory, host uptime, host load average (1,5,15 minutes)
*/
//TODO not used currently, may be used when spawning worker threads.
//TODO also, this does nothing.
var getHostInfo = function () {
  var hostInfo = {}
  return hostInfo
}

//export some stuff for the tester to use.
//module.exports.sendLogRecord = sendLogRecord
//module.exports.logConfig = logConfig
