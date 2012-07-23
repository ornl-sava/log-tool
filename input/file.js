exports.start = function(opts){
  //console.info('opts: ' + JSON.stringify(opts) )
  var input = require('fs').createReadStream('./'+opts.fileName, {encoding:'utf-8'})
  return input
}

exports.data = function(opts){

}

exports.end = function(opts){

}
