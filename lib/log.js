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

  var consoleOpts = { level : "debug", colorize : true }
  if(useConsole && opts && opts.consoleOpts) consoleOpts = opts.consoleOpts
  var fileOpts = { level : "debug", filename : DEFAULT_LOG_FILE }
  if(useConsole && opts && opts.fileOpts) fileOpts = opts.fileOpts

  //confirm loglevels are valid per allowedLevels list
  //TODO this will throw the error before any remaining valid transports are set up.  Is this the best behavior?
  if(useConsole){
    if( !consoleOpts.level )
      throw new Error("Console log level not defined!")
    if(allowedLevels.indexOf(consoleOpts.level) < 0 )
      throw new Error("Console log level has invalid level: " + consoleOpts.level)
  }
  if(useFile){
    if( !fileOpts.level )
      throw new Error("File log level not defined!")
    if(allowedLevels.indexOf(fileOpts.level) < 0 )
      throw new Error("File log level has invalid level: " + fileOpts.level)
  }

  var transports = [] //file must be first?  winston bug?  TODO confirm and report if true.
  if(useFile) transports.push( new (winston.transports.File)(fileOpts) )
  if(useConsole) transports.push( new (winston.transports.Console)(consoleOpts) )

  var logger = new (winston.Logger)({
    levels: winston.config.syslog.levels, 
    transports: transports
  })

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
