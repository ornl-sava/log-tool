var streamTests = require('../stream-tests-common.js')

suite("Stream Specification Tests: file-watch.js",function(){
  test('should pass stream-spec validation for readable', function( ){
    var opts = { "fileName":"in2.txt", "encoding":"utf-8", "timeout": 150, "interval": 20,} 
    var inputModule = require('../../input/file-watch.js')
    var currInput = new inputModule(opts)
    streamTests.readableStreamSpec(currInput)
  })
})

