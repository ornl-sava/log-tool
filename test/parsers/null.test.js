var es = require('event-stream')

exports.module = function(opts){
  var self = this;

  self.data = function(data){
    this.emit('data', data)
  }

  self.end = function(){
    this.emit('end')
  }

  self.stream = es.through(self.data, self.end)
}
