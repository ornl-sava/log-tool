'use strict';
module.exports = FileWatchStream

//available options: 
//    opts.filename  //path of file to open.
//
//      other options will be passed to GrowingFile.open
//        default values are: 
//          { flags: 'r',
//            encoding: null,
//            fd: null,
//            mode: 0666,
//            bufferSize: 64 * 1024,
//            timeout: 3000,
//            interval: 100
//          }
//        timeout and interval are specified by:
//          https://github.com/felixge/node-growing-file/blob/master/Readme.md (ver 0.1.3)
//        other options specified by:
//          http://nodejs.org/api/fs.html#fs_fs_createreadstream_path_options (ver 0.8.9)
//

//this will be invoked like a constructor, but really returns the reference below.
function FileWatchStream(opts){
  var GrowingFile = require('growing-file');
  //fake constructor
  return GrowingFile.open('./'+opts.fileName, opts);
}
