'use strict';

var winston = require('winston')
var DEFAULT_LOG_FILE = './error.log'

//setup logging
// Log to console and file unix syslog levels
//  syslog-config : node_modules/winston/lib/winston/config/syslog-config.js
//   uses the following levels:
//     debug:   0 "debug-level message"
//     info:    1 "informational message"
//     notice:  2 "normal, but significant, condition"
//     warning: 3 "warning conditions"
//     error:   4 "error conditions"
//     crit:    5 "critical conditions"
//     alert:   6 "action must be taken immediately"
//     emerg:   7 "system is unusable"

var allowedLevels = ["debug", "info", "notice", "warning", "error", "crit", "alert", "emerg"]

var initLog = function(opts){
  var useConsole = true
  var useFile = true
  if(opts && opts.useConsole) useConsole = opts.useConsole
  if(opts && opts.useFile) useFile = opts.useFile

  var consoleOpts = { level : "warning", colorize : true }
  if(useConsole && opts && opts.consoleOpts) consoleOpts = opts.consoleOpts
  var fileOpts = { level : "debug", filename : DEFAULT_LOG_FILE, fileFlushDelay : 1500 }
  if(useConsole && opts && opts.fileOpts) fileOpts = opts.fileOpts

  //confirm loglevels are valid per allowedLevels list
  //TODO probably a more concise way to do this.
  if(useConsole){
    if( !consoleOpts.level ){
      console.log("Warning: Console log level not defined! Defaulting to 'warning'")
      consoleOpts.level = 'warning'
    }else if(allowedLevels.indexOf(consoleOpts.level) < 0 ){
      console.log("Warning: Console log level has invalid level: " + consoleOpts.level + " Defaulting to 'warning'")
      consoleOpts.level = 'warning'
    }
  }
  if(useFile){
    /*
    // Create log directory if it doesnt exist
    //TODO 
    if ( ! fs.existsSync(LOG_DIR) ) {
      fs.mkdirSync(LOG_DIR);
    }
    */
    if( !fileOpts.level ){
      console.log("Warning: File log level not defined! Defaulting to 'warning'")
      fileOpts.level = 'debug'
    }else if(allowedLevels.indexOf(fileOpts.level) < 0 ){
      console.log("Warning: File log level has invalid level: " + fileOpts.level + " Defaulting to 'warning'")
      fileOpts.level = 'debug'
    }
  }

  var transports = [] //file must be first?  winston bug?  TODO confirm and report if true.
  if(useFile) transports.push( new (winston.transports.File)(fileOpts) )
  if(useConsole) transports.push( new (winston.transports.Console)(consoleOpts) )

  var logger = new (winston.Logger)({
    levels: winston.config.syslog.levels, 
    transports: transports
  })

  //invokes callback after the flush delay is over.
  logger.flushLog = function(cb){
    logger.transports.file.flush()
    setTimeout(cb, fileOpts.fileFlushDelay)
  }

  return logger
}

//Note: this is currently unused.
var clearLog = function(opts){
  var logFile = DEFAULT_LOG_FILE
  if(opts.logFile) logFile = opts.logFile
  var file = require('fs').createWriteStream(logFile, {encoding:'utf-8'})
  file.write('')
  file.close()
}

// export for use in other node.js files
module.exports.initLog = exports.initLog = initLog
module.exports.clearLog = exports.clearLog = clearLog
