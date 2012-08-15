module.exports = FileOutStream

function FileOutStream(opts){
  //fake constructor
  return require('fs').createWriteStream('./'+opts.fileName, {encoding:'utf-8'})
}
