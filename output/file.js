'use strict';
module.exports = FileOutStream

//available options: 
//    opts.filename  //path of file to open.
//
//      other options will be passed to createWriteStream, see:
//        http://nodejs.org/api/fs.html#fs_fs_createwritestream_path_options
//        createWriteStream default values (as of node 0.8.9) are: 
//          { flags: 'w',
//            encoding: null,
//            mode: 0666,
//          }

//this will be invoked like a constructor, but really returns the reference below.
function FileOutStream(opts){
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
