'use strict';
module.exports = ConsoleStream

//common options: NA

//this will be invoked like a constructor, but really returns the reference below.
function ConsoleStream(opts){
  //fake constructor
  var ostream = process.stdout

  //Note: normally process.stdout cannot be closed, this is a workaround
  //Note: will presumably not pass stream spec tests because of this.
  ostream.end = function(data){
    if(data) ostream.write(data)
  }

  return ostream
}
