exports.start = function(opts){
  //console.info('opts: ' + JSON.stringify(opts) )
  var output = require('fs').createWriteStream('./'+opts.fileName, {encoding:'utf-8'})
  return output
}

exports.data = function(opts){

}

exports.end = function(opts){

}
