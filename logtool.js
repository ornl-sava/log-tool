// Import opts command line options parser module
//  https://bitbucket.org/mazzarelli/js-opts/wiki/Home
var opts = require('opts');

var app = require('./lib/')

// CONSTANTS and defaults
var APP_VERSION = '0.0.1';
var DEFAULT_DEBUG = false;
var DEFAULT_LOG_CONFIG = './config/logs.json';
var DEFAULT_ENV = "Development";
var DEFAULT_CSV_OPTS = {trim: true, columns: true};
var DEFAULT_DB_TYPE = "redis-pubsub";
var DEFAULT_DB_NAME = '';
var DEFAULT_DB_CHANNEL = '';
var DEFAULT_DB_HOST = 'http://127.0.0.1';
var DEFAULT_DB_PORT = 5984;
var DEFAULT_DB_OPTS = { cache: false, raw: false };

// these will be set by command line arguments
var dbOptions = DEFAULT_DB_OPTS;
var debug = DEFAULT_DEBUG;
var inputDir;
var dbName;
var dbHost;
var dbPort;

var options = [
  { short       : 'v'
  , long        : 'version'
  , description : 'Show version and exit'
  , callback    : function () { console.log(APP_VERSION); process.exit(1); }
  },
  { short       : 'd'
  , long        : 'debug'
  , description : 'Show debugging info  (default:  ' + (debug ? 'true' : 'false') + ')'
  , callback    : function () { debug = true; }
  },
  { short       : 'lc'
  , long        : 'log-config'
  , description : 'Set location of (json) config file with list of log information  (default:  ' + DEFAULT_LOG_CONFIG + ')'
  , value       : true
  , callback    : function (value) {
        if ( path.existsSync(value) ) {
            common.logger.info('Using ' + value + ' for config file.');
        }
        else {
            common.logger.error('Input directory ' + value + ' does not exist.');
            process.exit(1);
        }
    }
  },
  { short       : 'h'
  , long        : 'host'
  , description : 'The hostname of redis instance  (default:  ' + DEFAULT_DB_HOST + ')'
  , value       : true
  , callback    : function (value) {
        common.logger.info(value);
        if ( ! value.match(/^http[s]?:\/\//) ) { //TODO
            common.logger.error('Host ' + value + ' is invalid IP address.');
            process.exit(1);
        }
        common.logger.info('Using ' + value + ' as redis instance.');
    }
  },
  { short       : 'p'
  , long        : 'port'
  , description : 'The port of redis instance  (default:  ' + DEFAULT_DB_PORT + ')'
  , value       : true
  , callback    : function (value) {
        if( isNaN( parseInt(value) ) ) {
            common.logger.error('Port ' + value + ' is invalid.');
            process.exit(1);
        }
        common.logger.info('Using ' + value + ' for redis connection port.');
    }
  },
  { short       : 'n'
  , long        : 'name'
  , description : 'The redis namespace'
  , value       : true
  , callback    : function (value) { common.logger.info('Using ' + value + ' for redis namespace.'); }
  },
  { short       : 'c'
  , long        : 'channel'
  , description : 'The name of redis pub/sub channel'
  , value       : true
  , callback    : function (value) { common.logger.info('Using ' + value + ' for redis pub/sub channel name.'); }
  }
];

opts.parse(options, true);

inputDir = opts.get('input-dir') || DEFAULT_INPUT_FILE_DIR;
dbName = opts.get('name') || DEFAULT_DB_NAME;
dbHost = opts.get('host') || DEFAULT_DB_HOST;
dbPort = opts.get('port') || DEFAULT_DB_PORT;
user = opts.get('user') || "";

app.init()
app.start()

app.stop()
