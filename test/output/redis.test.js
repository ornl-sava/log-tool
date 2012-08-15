var streamTests = require('../stream-tests-common.js')

var outputModule = require('../../output/redis.js')

suite("Stream Specification Tests: redis.js",function(){
  test('should pass stream-spec validation for writable', function( ){
    var opts = {
      "serverAddress" : "127.0.0.1",
      "serverPort"    : 6379,
      "keyPrefix"     : "logtool:store"
    } 
    streamTests.writableStreamSpec( new outputModule(opts) )
  })
})
