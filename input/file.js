exports.module = function(opts){
  var self = this;
  self.stream = require('fs').createReadStream('./'+opts.fileName, {encoding:'utf-8'})

  self.data = function(opts){
  }

  self.end = function(opts){
  }
}
