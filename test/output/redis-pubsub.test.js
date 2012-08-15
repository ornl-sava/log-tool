var streamTests = require('../stream-tests-common.js')

var outputModule = require('../../output/redis-pubsub.js')

suite("Stream Specification Tests: redis-pubsub.js",function(){
  test('should pass stream-spec validation for writable', function( ){
    var opts = {
      "serverAddress" : "127.0.0.1",
      "serverPort"    : 6379,
      "channel"       : "events"
    } 
    streamTests.writableStreamSpec( new outputModule(opts) )
  })
})
