"use strict";

// Import opts command line options parser module
//  https://bitbucket.org/mazzarelli/js-opts/wiki/Home
var opts = require('opts');

var fs = require('fs')
var path = require('path')

var core = require('./lib/core.js')

var optsObj = {}

optsObj.appConfig = {
  "environment": "logEmitter",
  "logEmitter": {
    "logOpts": {
      "useConsole"      : true,
      "consoleOpts"     : { "level" : "warning", "colorize" : true },
      "useFile"         : true,
      "fileOpts"        : { "level" : "debug", "filename" : "./log/logEmitter.log", "fileFlushDelay" : 1500  }
    }
  }
}
optsObj.inputConfig = {
  "infile":{
    "module":"file-watch",
    "fileName":"",
    "timeout": 1500,
    "interval": 100,
    "encoding":"utf-8"
  }
}
optsObj.outputConfig = {
  "outfile":{
    "module":"file",
    "fileName":""
  }
}
optsObj.parserConfig = {
  "firewall":{
    "module":"regex"
  , "regex": "^([^,]*),([^,]*),([^,]+),([^,]+),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*)"
  , "labels": ["timestamp", "priority", "operation", "messageCode", 
                "protocol", "sourceIP", "destIP", "sourceHostname", "destHostname", "sourcePort", 
                "destPort", "destService", "direction", "connectionsBuilt", "connectionsTornDown"
              ]
  , "fields": { "timestamp": {"regex": "DD/MMM/YYYY HH:mm:ss", "type": "moment"} }
  , "delimiter": "\r\n|\n"
  , "startTime":0
  , "endTime":2147483648
  },
  "snort":{
    "module":"regex"
  , "regex": "^(Line Number: \\d+){0,1},{0,1}\\[\\*\\*\\] \\[([0-9:]+)\\] ([\\S\\s]*) \\[\\*\\*\\]\\s*[\r\n|\r|\n](\\[Classification: ){0,1}([\\S\\s]*){0,1}?\\]{0,1} {0,1}\\[Priority: (\\d+)\\]\\s*[\r\n|\r|\n](\\d{2}\\/\\d{2}\\-\\d{2}:\\d{2}:\\d{2}\\.\\d{3})\\d{3} ([\\d\\.]+):{0,1}(\\d+){0,1} \\-> ([\\d\\.]+):{0,1}(\\d+){0,1}\\s*[\r\n|\r|\n]([\\s\\S]+)"
  , "labels": ["lineNumber", "rule", "ruleText", "junkText", "classification", "priority", "timestamp", "sourceIP", "sourcePort", "destIP", "destPort", "packetInfo"]
  , "delimiter" : "\r\n\r\n|\n\n"
  , "fields": { "timestamp": {"regex": "MM/DD-HH:mm:ss.SSS", "type": "moment"} }
  , "startTime":0
  , "endTime":2147483648
  , "relativeTime":true
  }
}
optsObj.connectionConfig = [
  {
    "input":"infile",
    "parser":"",
    "output":"outfile"
  }
]

var options = [
  { short       : 'v'
  , long        : 'version'
  , description : 'Show version and exit'
  , callback    : function () { console.log(core.version); process.exit(1); }
  },
  { short       : 'i'
  , long        : 'infile'
  , description : 'Set location of input file'
  , value       : true
  , callback    : function (value) {
        if ( fs.existsSync(value) ) {
            //console.log('Using ' + value + ' for input file.');
        }
        else {
            console.log('Input file ' + value + ' does not exist.');
            process.exit(1);
        }
    }
  },
  { short       : 'o'
  , long        : 'outfile'
  , description : 'Set location of output file'
  , value       : true
  , callback    : function (value) {
        if ( fs.existsSync( path.dirname(value) ) ){
            //console.log('Using ' + value + ' for output file.');
        }
        else {
            console.log('Parent dir of output file ' + value + ' does not exist.');
            process.exit(1);
        }
    }
  },
  { short       : 'p'
  , long        : 'parser'
  , description : 'The name of the parser to use.  Current options are "firewall" or "snort"'
  , value       : true
  , callback    : function (value) {
        if( ! optsObj.parserConfig[value] ) {
            console.log(value + ' is not a valid parser.')
            process.exit(1)
        }
    }
  },
  { short       : 's'
  , long        : 'startTime'
  , description : 'The start time.  items before this time will not be included in the output.'
  , value       : true
  , callback    : function (value) { }
  },
  { short       : 'e'
  , long        : 'endTime'
  , description : 'The end time.  items after this time will not be included in the output.'
  , value       : true
  , callback    : function (value) { }
  }
];

opts.parse(options, true);

var haveAllArgs = true

var infile = opts.get('infile')
if( !infile || infile === ""){
  console.log("missing argument: input file")
  haveAllArgs = false
}else{
  optsObj.inputConfig.infile.fileName = infile
}

var outfile = opts.get('outfile')
if( !outfile || outfile === ""){
  console.log("missing argument: output file")
  haveAllArgs = false
}else{
  optsObj.outputConfig.outfile.fileName = outfile
}

var parser = opts.get('parser')
if( !parser || parser === ""){
  console.log("missing argument: parser") //already checked that it was valid above
  haveAllArgs = false
}else{
  optsObj.connectionConfig[0].parser = parser
}

//TODO handling of default vals?
var startTime = opts.get('startTime')
var endTime = opts.get('endTime')
if(haveAllArgs){
  optsObj.parserConfig[opts.get('parser')].startTime = startTime
  optsObj.parserConfig[opts.get('parser')].endTime = endTime
  optsObj.inputConfig.infile.timeout = (endTime - startTime)*1000 + 50
  var instance = new core.LogTool(optsObj)
  instance.on('done', process.exit)
}else{
  process.exit(0);
}


