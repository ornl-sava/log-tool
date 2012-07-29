var streamTests = require('../stream-tests-common.js')

suite("Stream Specification Tests: file.js",function(){
  test('should pass stream-spec validation for readable', function( ){
    var opts = { "fileName":"in.txt", "encoding":"utf-8"} 
    var inputModule = require('../../input/file.js')
    var currInput = new inputModule.module(opts)
    streamTests.readableStreamSpec(currInput.stream)
  })
})

