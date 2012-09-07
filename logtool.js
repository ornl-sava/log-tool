"use strict";

// Import opts command line options parser module
//  https://bitbucket.org/mazzarelli/js-opts/wiki/Home
var opts = require('opts');

var core = require('./lib/core.js')

// CONSTANTS and defaults
var APP_VERSION = core.version;
var DEFAULT_CONFIG_DIR = 'config';

var options = [
  { short       : 'v'
  , long        : 'version'
  , description : 'Show version and exit'
  , callback    : function () { console.log(APP_VERSION); process.exit(1); }
  },
  { short       : 'c'
  , long        : 'config-dir'
  , description : 'Set directory with (json) config files (default:  ' + DEFAULT_CONFIG_DIR + ')'
  , value       : true
  , callback    : function (value) {
        if ( require('fs').existsSync(value) ) {
            console.log('Using ' + value + ' for config file.');
        }
        else {
            console.log('Input directory ' + value + ' does not exist.');
            process.exit(1);
        }
    }
  }
];

opts.parse(options, true);

var appOptions = {}

appOptions.configDir = DEFAULT_CONFIG_DIR
var configDir = opts.get('config-dir')
if(configDir) appOptions.configDir = configDir

var instance = new core.LogTool(appOptions)

instance.on('done', process.exit)

