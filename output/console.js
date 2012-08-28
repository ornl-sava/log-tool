'use strict';
module.exports = ConsoleStream

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
