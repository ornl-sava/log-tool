"use strict";

// Import opts command line options parser module
//  https://bitbucket.org/mazzarelli/js-opts/wiki/Home
var opts = require('opts');

var core = require('../lib/core.js')

var opts = {}

opts.inputConfig = {
  "in.txt":{
    "module":"file",
    "fileName":"in.txt",
    "encoding":"utf-8"
  }
}
opts.outputConfig = {
  "stdout":{
    "module":"console"
  }
}
opts.parserConfig = {
  "null":{
    "module":"null"
  }
}
opts.connectionConfig = [
  {
    "input":"in.txt",
    "parser":"null",
    "output":"stdout"
  }
]

var instance = new core.LogTool(opts)

instance.on('done', process.exit) //TODO best way to do this?  How come it sometime exists without needing this (eg. for file streams)?

//instance.stop()
