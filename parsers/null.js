//not needed
//exports.start = function(opts){}

exports.data = function(data){
  //this.emit('data', data)
  var lines = data.split('\n');
  //NB: for real parsers, don't do this, use es.split( same regex you already have ) or es json equiv.
  for(line in lines){
    this.emit('data', lines[line] + '\n')
    this.emit('data', 'and also ' + lines[line] + '\n')
  }
}

exports.end = function(){
  this.emit('end')
}
