var spec = require('stream-spec')
  , RedisPubsubStream = require('../redis-pubsub-stream.js')

describe('Stream Specification Tests', function() {

  describe('# writable stream-spec', function(){
    it('should pass stream-spec validation for writable', function(){
      writableStreamSpec(new RedisPubsubStream())
    })
  })

  describe('# readable stream-spec', function(){
    it('should pass stream-spec validation for readable', function(){
      readableStreamSpec(new RedisPubsubStream())
    })
  })

  describe('# through stream-spec', function(){
    it('should pass stream-spec validation for through', function(){
      readableStreamSpec(new RedisPubsubStream())
    })
  })
  
}) 


var writableStreamSpec = function (stream) {
  var s = spec(stream).writable().drainable()

  stream.write('write test')
  stream.end('end test')
  
  s.validate()
}

var readableStreamSpec = function (stream) {
  var s = spec(stream).readable().pausable({strict: true})
  
  stream.end()
  
  s.validate()
}

var throughStreamSpec = function (stream) {
  var s = spec(stream).through({strict: true})

  stream.write('write test')
  stream.end('end test')
  
  s.validate()
}

