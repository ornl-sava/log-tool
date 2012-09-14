'use strict';
module.exports = ConsoleStream

//common options: NA

//this will be invoked like a constructor, but really returns the reference below.
function ConsoleStream(opts){
  process.stdin.resume()
  process.stdin.setEncoding('utf8')
  return process.stdin
}
