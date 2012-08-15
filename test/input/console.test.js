var streamTests = require('../stream-tests-common.js')

suite("Stream Specification Tests: console.js",function(){
  test('should pass stream-spec validation for readable', function( ){
    var opts = {}
    var inputModule = require('../../input/console.js')
    var currInput = new inputModule(opts)
    streamTests.readableStreamSpec(currInput)
  })
})

