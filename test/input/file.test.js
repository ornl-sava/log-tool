/*global suite:false, test:false*/
'use strict';

var streamTests = require('../stream-tests-common.js')

suite("Stream Specification Tests: file.js",function(){
  test('should pass stream-spec validation for readable', function( ){
    var opts = { "fileName":"in.txt", "encoding":"utf-8"} 
    var InputModule = require('../../input/file.js')
    var currInput = new InputModule(opts)
    streamTests.readableStreamSpec(currInput)
  })
})

