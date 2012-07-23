
var winston = require('winston');
var DEFAULT_ERROR_LOG_FILE = './error.log';
var error_log_file = DEFAULT_ERROR_LOG_FILE;

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
var logger = new (winston.Logger)({
  levels: winston.config.syslog.levels, 
  transports: [
    new (winston.transports.Console)({ colorize: true, level: 'warning' }),
    new (winston.transports.File)({ filename: error_log_file, level: 'debug' })
  ]
});

// export for use in other node.js files
exports.logger = logger;
