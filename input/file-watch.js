'use strict';
module.exports = FileWatchStream

function FileWatchStream(opts){
  var GrowingFile = require('growing-file');
  //fake constructor
  return GrowingFile.open('./'+opts.fileName, opts);
}
