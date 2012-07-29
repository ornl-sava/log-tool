exports.module = function(opts){
  var GrowingFile = require('growing-file');
  var self = this;
  self.stream = GrowingFile.open('./'+opts.fileName, {timeout:opts.timeout, interval:opts.interval, encoding:opts.encoding});

  self.data = function(opts){
  }

  self.end = function(opts){
  }
}
