'use strict';
module.exports = ConsoleStream

function ConsoleStream(opts){
  process.stdin.resume()
  process.stdin.setEncoding('utf8')
  //fake constructor
  return process.stdin
}
