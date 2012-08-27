'use strict';
module.exports = FileOutStream

function FileOutStream(opts){
  //fake constructor
  var fstream = require('fs').createWriteStream('./'+opts.fileName, {encoding:'utf-8'})

  fstream.oldwrite = fstream.write

  fstream.write = function(a, b, c){
    if(typeof a === "string")
      fstream.oldwrite(a, b, c)
    else if(a instanceof Buffer)
      fstream.oldwrite(a, b, c)
    else //currently only useful for testing.  Could be expanded to do something useful based on opts.
      fstream.oldwrite(JSON.stringify(a)+'\n', b, c)
  }

  return fstream
}
