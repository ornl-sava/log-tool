var streamTests = require('../stream-tests-common.js')

var outputModule = require('../../output/file.js')

suite("Stream Specification Tests: file.js",function(){
  test('should pass stream-spec validation for writable', function( ){
    var opts = { "fileName":"out.txt" } 
    streamTests.writableStreamSpec( (new outputModule.module(opts)).stream )
  })
})
