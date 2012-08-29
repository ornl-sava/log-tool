"use strict";

// Import opts command line options parser module
//  https://bitbucket.org/mazzarelli/js-opts/wiki/Home
var opts = require('opts');

var core = require('../lib/core.js')

var opts = {}

opts.inputConfig = {
  "watch":{
    "module":"file-watch",
    "fileName":"temp.in.txt",
    "timeout": 1900,
    "interval": 100,
    "encoding":"utf-8"
  }
}
opts.outputConfig = {
  "out.txt":{
    "module":"file",
    "fileName":"out.txt"
  }
}
opts.parserConfig = {
  "null":{
    "module":"null"
  }
}
opts.connectionConfig = [
  {
    "input":"watch",
    "parser":"null",
    "output":"out.txt"
  }
]

var instance = new core.LogTool(opts)

instance.on('done', process.exit) //TODO best way to do this?  How come it sometime exists without needing this (eg. for file streams)?

//instance.stop()
