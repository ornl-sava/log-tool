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
      var i, j
      self.logger.log('info', 'All input streams have stopped, stopping remaining streams ...')

      self.logger.log('debug', 'Stopping parser streams')
      for( i=0; i<parserStreams.length; i++){
        if (Array.isArray( parserStreams[i]) ) {
          for (j=0; j<parserStreams[i].length; j++) {
            if (parserStreams[i][j].readable) {
              parserStreams[i][j].end()
            }
          }
        }else console.log("STREAM ITEM IS NOT ARRAY WHEN EXPECTED!")
        //else if(parserStreams[i].writable) parserStreams[i].end()
      }
      self.logger.log('debug', 'Stopping output streams')
      for( i=0; i<outputStreams.length; i++){
        if (Array.isArray( outputStreams[i]) ) {
          for (j=0; j<outputStreams[i].length; j++) {
            if (outputStreams[i][j].writable) {
              outputStreams[i][j].end()
            }
          }
        }else console.log("STREAM ITEM IS NOT ARRAY WHEN EXPECTED!")
        //else if(outputStreams[i].writable) outputStreams[i].end()
      }
      //flush the log file, emit done when that's finished.
      self.logger.flushLog( function(){self.emit('done')} )
    }
  }

  /* when in istream ends, this fn will check if any others are still readable, and if not will call stop() for application */
  self.handleIstreamEnd = function (){
    var j=0
    var i=0
    var done = false
    while (j<inputStreams.length && !done) {
      if (Array.isArray( inputStreams[j]) ) {
        for (i=0; i<inputStreams[j].length; i++) {
          if (inputStreams[j][i].readable) {
            done = true
          }
        }
      }else console.log("STREAM ITEM IS NOT ARRAY WHEN EXPECTED!")
      /*else if (inputStreams[j].readable) {
        done = true
      }*/
      j++
    }
    self.logger.log('debug', 'j was ' + j + ' length was ' + inputStreams.length)
    if (j === inputStreams.length) {
      self.logger.log('debug', 'engine stopping')
      self.stop()
    }
  }

  //TODO currently, all parsers and all output modules will be ended when all inputs have ended.  May want to do it by connection instead.
  var istreamEndHandler = function(){
    //self.logger.log('debug', 'istrem index ' + this.ownIndex + ' has ended, handling ...')

    //NOTE: I suspect that some streams are emitting 'end' before setting 'readable' to false, which is messing up the handleIstreamEnd function.
    // using process.nextTick seems to be an effective workaround for that
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
  var i, j
  var src, prs, dst //copy of field from connectionConfig, for convenience
  var moduleName, moduleConfig //also for convenience
  var InputModule, ParserModule, OutputModule //refs to actual module
  var currInputs, currParsers, currOutputs //instantiated objs (or arrays of objs) to pipe together.
  for( i=0; i<connectionConfig.length; i++){

    //we only need the module name, then pass the remaining values to the module's start method as its opts.
    src = connectionConfig[i].input
    if (! Array.isArray(src) ) { 
      src = [src] //if it isn't an array already, make it into an array of length one.
    }
    currInputs = []
    for(j=0; j<src.length; j++){
      moduleConfig = inputConfig[src[j]]
      //console.log('src is: '+JSON.stringify(src[j])+', module config is: '+JSON.stringify(moduleConfig))
      moduleName = inputConfig[src[j]].module
      self.logger.log('debug', 'connection: ' + i + ', input name: ' + src[j] + 
        ', module name: ' + moduleName + ', module config: ' + JSON.stringify(moduleConfig) )

      if(appConfig.inputModules.indexOf(moduleName) < 0) //not an ind. module, in the folder
        InputModule = require(inputDir + moduleName +'.js')
      else //it is a module, load from there.
        InputModule = require('../node_modules/' + moduleName + '/' + moduleName +'.js')

      currInputs.push( new InputModule(moduleConfig) )
      //may need to keep track of these again at some point, idk.
      //currInputs[j].ownType = 'input' 
      //currInputs[j].ownIndex = i
      currInputs[j].on("error", streamErrHandler )
      currInputs[j].on("end", istreamEndHandler )
    }
    inputStreams.push(currInputs) //need to save this reference for handling exit, etc.


    prs = connectionConfig[i].parser
    if (! Array.isArray(prs) ) { 
      prs = [prs] //if it isn't an array already, make it into an array of length one.
    }
    currParsers = []
    for(j=0; j<prs.length; j++){
      moduleConfig = parserConfig[prs[j]]
      //console.log('prs is: '+JSON.stringify(prs[j])+', module config is: '+JSON.stringify(moduleConfig))
      moduleName = parserConfig[prs[j]].module
      self.logger.log('debug', 'connection: ' + i + ', parser name: ' + prs[j] + 
        ', module name: ' + moduleName + ', module config: ' + JSON.stringify(moduleConfig) )

      if(appConfig.parserModules.indexOf(moduleName) < 0) //not an ind. module, in the folder
        ParserModule = require(parserDir + moduleName +'.js')
      else //it is a module, load from there.
        ParserModule = require('../node_modules/' + moduleName + '/' + moduleName +'.js')

      currParsers.push( new ParserModule(moduleConfig) )
      //may need to keep track of these again at some point, idk.
      //currParsers[j].ownType = 'parser' 
      //currParsers[j].ownIndex = i
      currParsers[j].on("error", streamErrHandler )
    }
    parserStreams.push(currParsers) //need to save this reference for handling exit, etc.


    dst = connectionConfig[i].output
    if (! Array.isArray(dst) ) { 
      dst = [dst] //if it isn't an array already, make it into an array of length one.
    }
    currOutputs = []
    for(j=0; j<dst.length; j++){
      moduleConfig = outputConfig[dst[j]]
      //console.log('dst is: '+JSON.stringify(dst[j])+', module config is: '+JSON.stringify(moduleConfig))
      moduleName = outputConfig[dst[j]].module
      self.logger.log('debug', 'connection: ' + i + ', output name: ' + dst[j] + 
        ', module name: ' + moduleName + ', module config: ' + JSON.stringify(moduleConfig) )

      if(appConfig.outputModules.indexOf(moduleName) < 0) //not an ind. module, in the folder
        OutputModule = require(outputDir + moduleName +'.js')
      else //it is a module, load from there.
        OutputModule = require('../node_modules/' + moduleName + '/' + moduleName +'.js')

      currOutputs.push( new OutputModule(moduleConfig) )
      //may need to keep track of these again at some point, idk.
      //currOutputs[j].ownType = 'output' 
      //currOutputs[j].ownIndex = i
      currOutputs[j].on("error", streamErrHandler )
    }
    outputStreams.push(currOutputs) //need to save this reference for handling exit, etc.


    //TODO double check this is ok for pause/resume, or else maybe use es.connect
    //NB: if several output streams point to same file, can have portions overwrite each other.
    //TODO connect correctly, not just for [0]
    //util.pump(currParsers[0], currOutputs[0])  //connect parser -> output
    //util.pump(currInputs[0], currParsers[0])   //connect input -> parser

    //connect last parser to all outputs
    for(j=0; j<currOutputs.length; j++){
      currParsers[currParsers.length-1].pipe(currOutputs[j])
    }
    //connect all parsers to each other (if there is more than one parser)
    for(j=0; j<(currParsers.length-1); j++){
      currParsers[j].pipe(currParsers[j+1])
    }
    //connect all inputs to first parser
    for(j=0; j<currInputs.length; j++){
      currInputs[j].pipe(currParsers[0])
    }

  }

  if(connectionConfig.length === 0){
    self.logger.log('warn', 'No connections specified, exiting ...')
    //process.nextTick does not work here, winston throws error, perhaps it's not done initializing itself yet?
    setTimeout(self.stop, 5)
  }else{
    self.logger.log('info', 'All module instances connected, reading logs...')
  }
}
