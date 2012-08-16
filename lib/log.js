
var winston = require('winston')
var DEFAULT_ERROR_LOG_FILE = './error.log'

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

var initLog = function(opts){
  var logFile = DEFAULT_ERROR_LOG_FILE
  if(opts.logFile) logFile = opts.logFile

  //TODO confirm loglevels are valid per list above
  var consoleLogLevel = 'debug'
  var fileLogLevel = 'debug'
  if(opts.logLevel){ 
    consoleLogLevel = opts.logLevel
    fileLogLevel = opts.logLevel
  }
  if(opts.consoleLogLevel) consoleLogLevel = opts.consoleLogLevel
  if(opts.fileLogLevel) fileLogLevel = opts.fileLogLevel

  var logger = new (winston.Logger)({
    levels: winston.config.syslog.levels, 
    transports: [
      new (winston.transports.Console)({ colorize: true, level: consoleLogLevel }),
      new (winston.transports.File)({ filename: logFile, level: fileLogLevel })
    ]
  })
  return logger
}

var clearLog = function(opts){
  var logFile = DEFAULT_ERROR_LOG_FILE
  if(opts.logFile) logFile = opts.logFile
  var file = require('fs').createWriteStream(logFile, {encoding:'utf-8'})
  file.write('')
  file.close()
}

// export for use in other node.js files
module.exports.initLog = exports.initLog = initLog
module.exports.clearLog = exports.clearLog = clearLog
