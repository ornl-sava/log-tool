//not needed
//exports.start = function(opts){}

exports.data = function(data){
  this.emit('data', data)
}

exports.end = function(){
  this.emit('end')
}
