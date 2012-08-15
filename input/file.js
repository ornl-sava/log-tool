module.exports = FileStream

function FileStream(opts){
  //fake constructor
  if( !opts.encoding )
    opts.encoding = 'utf-8'
  return require('fs').createReadStream('./'+opts.fileName, opts)
}
