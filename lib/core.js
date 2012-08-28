/* 
    read from a log file, convert to JSON, and emit new records
*/

'use strict';

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

  /* 
    end all streams as needed and stop the application
  */
  self.stopping = false
  self.stop = function () {
    if(!self.stopping){ //not really needed, but prevents logspam that was present in some cases
      self.stopping = true
      var i
      self.log('info', 'All input streams have stopped, stopping remaining streams ...')

      self.log('debug', 'Stopping parser streams')
      for( i=0; i<parserStreams.length; i++){
        if(parserStreams[i].writable) parserStreams[i].end()
      }
      self.log('debug', 'Stopping output streams')
      for( i=0; i<outputStreams.length; i++){
        if(outputStreams[i].writable) outputStreams[i].end()
      }
      //finally, end your logger instance.
      self.logger.transports.file.flush()
      //self.logger.transports.file.close()

      //and wait a bit amount for above to finish.
      setTimeout(function(){self.emit('done')}, 500)
    }
  }

  /* when in istream ends, this fn will check if any others are still readable, and if not will call stop() for application */
  self.handleIstreamEnd = function (){
    var j=0
    var done = false
    while(j<inputStreams.length && !done){
      if(inputStreams[j].readable){
        done = true
      }
      j++
    }
    self.log('debug', 'j was ' + j + ' length was ' + inputStreams.length)
    if( j === inputStreams.length ){
      self.log('debug', 'engine stopping')
      self.stop()
    }
  }

  //stores references to all streams, so we can close them all properly when needed
  var inputStreams = []
  var outputStreams = []
  var parserStreams = []

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
  self.logger = log.initLog(logOpts)
  self.log = function(lvl, msg){
    self.logger.log(lvl, msg)
  }
  self.errLogger = function(msg){
    self.log('error', msg)
    console.log(msg)
  }

  self.log('info', 'Started.  Connecting module instances...')

  // TODO - should this be spawning off workers for each of these?  Don't care for now.
  var i
  for( i=0; i<connectionConfig.length; i++){
    var src = connectionConfig[i].input
    var dst = connectionConfig[i].output
    var prs = connectionConfig[i].parser

    //we only need the module name, then pass the remaining values to the module's start method as its opts.
    self.log('debug', 'connection: ' + i + ', input name: ' + src + ', info: ' + JSON.stringify(inputConfig[src]) )
    var InputModule = require('../input/'+inputConfig[src].module +'.js')
    var currInput = new InputModule(inputConfig[src])
    inputStreams.push(currInput)

    self.log('debug', 'connection: ' + i + ', output name: ' + dst + ', info: ' + JSON.stringify(outputConfig[dst]) )
    var OutputModule = require('../output/'+outputConfig[dst].module +'.js')
    var currOutput = new OutputModule(outputConfig[dst])
    outputStreams.push(currOutput)

    self.log('debug', 'connection: ' + i + ', parser name: ' + prs + ', info: ' + JSON.stringify(parserConfig[prs]) )
    var ParserModule = require('../parsers/'+parserConfig[prs].module +'.js')
    var currParser = new ParserModule(parserConfig[prs])
    parserStreams.push(currParser)

    //TODO double check this is ok for pause/resume, or else maybe use es.connect
    //TODO if several output streams point to same file, can have portions overwrite each other.
    util.pump(currParser, currOutput)  //connect parser -> output
    util.pump(currInput, currParser)   //connect input -> parser
  }

  if(connectionConfig.length === 0){
    self.log('warn', 'No connections specified, exiting ...')
    setTimeout(self.stop, 5)
  }else{
    self.log('info', 'All module instances connected, reading logs...')

    //listen for errors
    for( i=0; i< inputStreams.length; i++){
      inputStreams[i].on("error", self.errLogger )
    }
    for( i=0; i< outputStreams.length; i++){
      outputStreams[i].on("error", self.errLogger )
    }
    for( i=0; i< parserStreams.length; i++){
      parserStreams[i].on("error", self.errLogger )
    }

    var istreamEndHandler = function(){
      this.log('debug', 'istrem index ' + this.ownIndex + ' has ended, handling ...')
      //NOTE: setTimeout is somewhat a workaround here, 
      // I suspect that some streams are emitting 'end' before setting 'readable' to false, which is messing up the handleIstreamEnd function.
      setTimeout(self.handleIstreamEnd, 1)
    }

    for( i=0; i< inputStreams.length; i++){
      inputStreams[i].log = self.log
      inputStreams[i].ownIndex = i
      inputStreams[i].handleEnd = istreamEndHandler
      
      inputStreams[i].on("end", inputStreams[i].handleEnd ) 
    }

  }
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
