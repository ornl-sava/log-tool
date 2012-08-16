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
  , EventEmitter = require('events').EventEmitter

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

// figure out the working directory
var dirs = process.cwd().split('/')
  , workingDir = dirs[dirs.length - 1]
  , basePath = (workingDir === 'bin' || workingDir === 'lib' || workingDir === 'test' ? '..' : '.')
    
var log = require('./log.js')
//var logger = require(process.env.PWD + '/' + basePath + '/lib/log.js')

// Export version from the package.json file
var version = module.exports.version = require(process.env.PWD + '/' + basePath + '/package.json').version

// Set the title of the process in ps
process.title = require('../package.json').name

// configuration files (relative to the bin or lib directory)
var appConfigFile = path.normalize(process.env.PWD + '/' + basePath + '/config/global.json')
var inputConfigFile = path.normalize(process.env.PWD + '/' + basePath + '/config/input.json')
var outputConfigFile = path.normalize(process.env.PWD + '/' + basePath + '/config/output.json')
var parserConfigFile = path.normalize(process.env.PWD + '/' + basePath + '/config/parsers.json')
var connectionConfigFile = path.normalize(process.env.PWD + '/' + basePath + '/config/connections.json')

// the modules directories
var parserDir = path.normalize(process.env.PWD + '/' + basePath + '/parsers')
var inputDir = path.normalize(process.env.PWD + '/' + basePath + '/input')
var outputDir = path.normalize(process.env.PWD + '/' + basePath + '/output')
// the core libs directory
var libsDir = path.normalize(process.env.PWD + '/' + basePath + '/lib')


//stores references to all streams, so we can close them all properly when needed
var inputStreams = []
var outputStreams = []
var parserStreams = []


/*
  Start the application
  The following opts fields will override whatever values are in the config files.
  (Currently, only the testers will pass opts.)
  opts.appConfig 
  opts.inputConfig 
  opts.outputConfig 
  opts.parserConfig 
  opts.connectionConfig
*/

module.exports.LogTool = exports.LogTool = LogTool
util.inherits(LogTool, EventEmitter)

function LogTool(opts) {

  var self = this

  var appConfig = {}
  var inputConfig = {}
  var outputConfig = {}
  var parserConfig = {}
  var connectionConfig = {}

  if( opts && opts.appConfig ){
    appConfig = opts.appConfig
  }else{
    appConfig = JSON.parse(fs.readFileSync(appConfigFile, 'utf-8'))
  }
  if( opts && opts.inputConfig ){
    inputConfig = opts.inputConfig
  }else{
    inputConfig = JSON.parse(fs.readFileSync(inputConfigFile, 'utf-8'))
  }
  if( opts && opts.outputConfig ){
    outputConfig = opts.outputConfig
  }else{
    outputConfig = JSON.parse(fs.readFileSync(outputConfigFile, 'utf-8'))
  }
  if( opts && opts.parserConfig ){
    parserConfig = opts.parserConfig
  }else{
    parserConfig = JSON.parse(fs.readFileSync(parserConfigFile, 'utf-8'))
  }
  if( opts && opts.connectionConfig ){
    connectionConfig = opts.connectionConfig
  }else{
    connectionConfig = JSON.parse(fs.readFileSync(connectionConfigFile, 'utf-8'))
  }

  //set up all the log stuff
  var logOpts = {} //TODO populate from appConfig
  logOpts.consoleLogLevel = 'notice'
  //log.clearLog(logOpts) //TODO should be cleared/not based on appConfig also
  var logger = log.initLog(logOpts)

  logger.log('info', 'Started.  Connecting module instances...')

  // TODO - should this be spawning off workers for each of these?  Don't care for now.
  for(var i=0; i<connectionConfig.length; i++){
    var src = connectionConfig[i]['input']
    var dst = connectionConfig[i]['output']
    var prs = connectionConfig[i]['parser']

    //we only need the module name, then pass the remaining values to the module's start method as its opts.
    logger.log('debug', 'connection: ' + i + ', input name: ' + src + ', info: ' + JSON.stringify(inputConfig[src]) )
    var inputModule = require('../input/'+inputConfig[src]['module']+'.js')
    var currInput = new inputModule(inputConfig[src])
    inputStreams.push(currInput)

    logger.log('debug', 'connection: ' + i + ', output name: ' + dst + ', info: ' + JSON.stringify(outputConfig[dst]) )
    var outputModule = require('../output/'+outputConfig[dst]['module']+'.js')
    var currOutput = new outputModule(outputConfig[dst])
    outputStreams.push(currOutput)

    logger.log('debug', 'connection: ' + i + ', parser name: ' + prs + ', info: ' + JSON.stringify(parserConfig[prs]) )
    var parserModule = require('../parsers/'+parserConfig[prs]['module']+'.js')
    var currParser = new parserModule(parserConfig[prs])
    parserStreams.push(currParser)

    //TODO double check this is ok for pause/resume, or else maybe use es.connect
    //TODO if several output streams point to same file, can have portions overwrite each other.
    util.pump(currParser, currOutput)  //connect parser -> output
    util.pump(currInput, currParser)   //connect input -> parser
  }

  logger.log('info', 'All module instances connected, reading logs...')

  function done(){
    self.emit('done')
  }

  //TODO this is placeholder, should actually check if input streams are finished
  setTimeout(done, 31)

}

/* 
  Stop the application
*/
LogTool.prototype.stop = function () {
  logger.log('info', 'Stopping')
  //TODO call stop methods for all modules as needed
}

/* 
  Gather host information
  @return {Object} hostInfo Host information: host name, operating system type, operating system platform, operating system release, CPU architecture, host CPU count, host memory, host uptime, host load average (1,5,15 minutes)
*/
//TODO not used currently, may be used when spawning worker threads.
var getHostInfo = function () {
  // Set the hostname, which every event will be tagged with
  //var hostname = os.hostname()
  //var numCPUs = os.cpus().length;
  var hostInfo = {}
  return hostInfo
}
