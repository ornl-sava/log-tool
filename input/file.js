'use strict';
module.exports = FileStream

//available options: 
//    opts.filename  //path of file to open.
//
//      other options will be passed to createReadStream, see:
//        http://nodejs.org/api/fs.html#fs_fs_createreadstream_path_options
//        createReadStream default values (as of node 0.8.9) are: 
//          { flags: 'r',
//            encoding: null,
//            fd: null,
//            mode: 0666,
//            bufferSize: 64 * 1024
//          }

//this will be invoked like a constructor, but really returns the reference below.
function FileStream(opts){
  if( !opts.encoding )
    opts.encoding = 'utf-8'
  return require('fs').createReadStream('./'+opts.fileName, opts)
}
