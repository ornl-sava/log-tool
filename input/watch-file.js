exports.start = function(opts){
  //console.info('opts: ' + JSON.stringify(opts) )
  var GrowingFile = require('growing-file');
  var file = GrowingFile.open('./'+opts.fileName, {timeout:opts.timeout, interval:opts.interval, encoding:opts.encoding});
  //var input = require('fs').createReadStream('./'+opts.fileName, {encoding:'utf-8'})
  return file
}

exports.data = function(opts){

}

exports.end = function(opts){

}
