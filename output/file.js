exports.start = function(){
  var output = require('fs').createWriteStream('./out.txt', {encoding:'utf-8'})
  return output
}

exports.data = function(){

}

exports.end = function(){

}
