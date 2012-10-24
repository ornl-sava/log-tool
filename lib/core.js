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

// the modules directories
var parserDir = path.normalize(process.env.PWD + '/' + basePath + '/parsers/')
var inputDir = path.normalize(process.env.PWD + '/' + basePath + '/input/')
var outputDir = path.normalize(process.env.PWD + '/' + basePath + '/output/')
// the core libs directory
//var libsDir = path.normalize(process.env.PWD + '/' + basePath + '/lib') //currently unused.

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

//feels slightly hacky
function isJsonString(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

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
      self.logger.log('info', 'All input streams have stopped, stopping remaining streams ...')

      self.logger.log('debug', 'Stopping parser streams')
      for( i=0; i<parserStreams.length; i++){
        if(parserStreams[i].writable) parserStreams[i].end()
      }
      self.logger.log('debug', 'Stopping output streams')
      for( i=0; i<outputStreams.length; i++){
        if(outputStreams[i].writable) outputStreams[i].end()
      }
      //flush the log file, emit done when that's finished.
      self.logger.flushLog( function(){self.emit('done')} )
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
    self.logger.log('debug', 'j was ' + j + ' length was ' + inputStreams.length)
    if( j === inputStreams.length ){
      self.logger.log('debug', 'engine stopping')
      self.stop()
    }
  }

  var istreamEndHandler = function(){
    self.logger.log('debug', 'istrem index ' + this.ownIndex + ' has ended, handling ...')
    //NOTE: setTimeout is somewhat a workaround here, 
    // I suspect that some streams are emitting 'end' before setting 'readable' to false, which is messing up the handleIstreamEnd function.
    //trying process.nextTick
    //setTimeout(self.handleIstreamEnd, 1)
    process.nextTick(self.handleIstreamEnd)
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

  // configuration files (relative to the bin or lib directory)
  var configPath = basePath + '/config'
  if(opts && opts.configDir) configPath = basePath + '/' + opts.configDir
  var appConfigFile = path.normalize(process.env.PWD + '/' + configPath + '/app.json')
  var inputConfigFile = path.normalize(process.env.PWD + '/' + configPath + '/input.json')
  var outputConfigFile = path.normalize(process.env.PWD + '/' + configPath + '/output.json')
  var parserConfigFile = path.normalize(process.env.PWD + '/' + configPath + '/parsers.json')
  var connectionConfigFile = path.normalize(process.env.PWD + '/' + configPath + '/connections.json')

  var fileText = ''
  if( opts && opts.appConfig ){
    appConfig = opts.appConfig
  }else{
    fileText = fs.readFileSync(appConfigFile, 'utf-8')
    if(isJsonString(fileText)){
      appConfig = JSON.parse(fileText)
    }else{
      console.log('Error: could not read app config file!') //because we cannot init the logger, of course.
      process.exit(100)
    }
  }

  //if these are undefined, assume they should be empty lists.
  if (! appConfig.inputModules) appConfig.inputModules = []
  if (! appConfig.outputModules) appConfig.outputModules = []
  if (! appConfig.parserModules) appConfig.parserModules = []

  self.env = appConfig.environment
  
  //set up all the log stuff
  var logOpts = appConfig[self.env].logOpts 
  self.logger = log.initLog(logOpts)
  var streamErrHandler = function(msg){
    self.logger.log('error', ''+msg) //concatenate makes msg string if it isnt
    //TODO in some cases, can end up with lots of 'write after end errors', not sure why or how to prevent.
    //TODO do we have to end those streams here also?
  }
  self.logger.log('info', 'Started.  Reading configuration info...')

  if( opts && opts.inputConfig ){
    inputConfig = opts.inputConfig
  }else{
    fileText = fs.readFileSync(inputConfigFile, 'utf-8')
    if(isJsonString(fileText)){
      inputConfig = JSON.parse(fileText)
    }else{
      self.logger.log('error', 'could not read input config file!')
      process.nextTick( self.stop )
    }
  }

  if( opts && opts.outputConfig ){
    outputConfig = opts.outputConfig
  }else{
    fileText = fs.readFileSync(outputConfigFile, 'utf-8')
    if(isJsonString(fileText)){
      outputConfig = JSON.parse(fileText)
    }else{
      self.logger.log('error', 'could not read output config file!')
      process.nextTick( self.stop )
    }
  }

  if( opts && opts.parserConfig ){
    parserConfig = opts.parserConfig
  }else{
    fileText = fs.readFileSync(parserConfigFile, 'utf-8')
    if(isJsonString(fileText)){
      parserConfig = JSON.parse(fileText)
    }else{
      self.logger.log('error', 'could not read parser config file!')
      process.nextTick( self.stop )
    }
  }

  if( opts && opts.connectionConfig ){
    connectionConfig = opts.connectionConfig
  }else{
    fileText = fs.readFileSync(connectionConfigFile, 'utf-8')
    if(isJsonString(fileText)){
      connectionConfig = JSON.parse(fileText)
    }else{
      self.logger.log('error', 'could not read connection config file!')
      process.nextTick( self.stop )
    }
  }
  
  self.logger.log('info', 'Connecting module instances...')

  // TODO - should this be spawning off workers for each of these?  Don't care for now.
  var i
  for( i=0; i<connectionConfig.length; i++){
    var src = connectionConfig[i].input
    var dst = connectionConfig[i].output
    var prs = connectionConfig[i].parser
    var srcModule = inputConfig[src].module
    var dstModule = outputConfig[dst].module
    var prsModule = parserConfig[prs].module
    var InputModule
    var OutputModule
    var ParserModule

    //we only need the module name, then pass the remaining values to the module's start method as its opts.
    self.logger.log('debug', 'connection: ' + i + ', input name: ' + src + ', info: ' + JSON.stringify(inputConfig[src]) )
    if(appConfig.inputModules.indexOf(srcModule) < 0)
      InputModule = require(inputDir + srcModule +'.js')
    else
      InputModule = require('../node_modules/' + srcModule + '/' + srcModule +'.js')
    var currInput = new InputModule(inputConfig[src]) 
    inputStreams.push(currInput) //need to save this reference for handling exit, etc.

    self.logger.log('debug', 'connection: ' + i + ', output name: ' + dst + ', info: ' + JSON.stringify(outputConfig[dst]) )
    if(appConfig.outputModules.indexOf(dstModule) < 0)
      OutputModule = require(outputDir + dstModule +'.js')
    else
      OutputModule = require('../node_modules/' + dstModule + '/' + dstModule +'.js')
    var currOutput = new OutputModule(outputConfig[dst])
    outputStreams.push(currOutput) //need to save this reference for handling exit, etc.

    self.logger.log('debug', 'connection: ' + i + ', parser name: ' + prs + ', info: ' + JSON.stringify(parserConfig[prs]) )
    if(appConfig.parserModules.indexOf(prsModule) < 0)
      ParserModule = require(parserDir + prsModule +'.js')
    else
      ParserModule = require('../node_modules/' + prsModule + '/' + prsModule +'.js')
    var currParser = new ParserModule(parserConfig[prs])
    parserStreams.push(currParser) //need to save this reference for handling exit, etc.

    //inputStreams[i].log = self.logger.log
    outputStreams[i].ownType = 'output'
    parserStreams[i].ownType = 'parser'
    inputStreams[i].ownType = 'input'
    outputStreams[i].ownIndex = i
    parserStreams[i].ownIndex = i
    inputStreams[i].ownIndex = i
    inputStreams[i].handleEnd = istreamEndHandler
    inputStreams[i].on("end", inputStreams[i].handleEnd ) 

    //listen for errors
    inputStreams[i].on("error", streamErrHandler )
    outputStreams[i].on("error", streamErrHandler )
    parserStreams[i].on("error", streamErrHandler )

    //TODO double check this is ok for pause/resume, or else maybe use es.connect
    //TODO if several output streams point to same file, can have portions overwrite each other.
    util.pump(currParser, currOutput)  //connect parser -> output
    util.pump(currInput, currParser)   //connect input -> parser
  }

  if(connectionConfig.length === 0){
    self.logger.log('warn', 'No connections specified, exiting ...')
    //process.nextTick does not work here, winston throws error, perhaps it's not done initializing itself yet?
    setTimeout(self.stop, 5)
  }else{
    self.logger.log('info', 'All module instances connected, reading logs...')
  }
}
