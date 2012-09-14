'use strict';

var streamTests = require('../stream-tests-common.js')

suite("Stream Specification Tests: console.js",function(){
  test('should pass stream-spec validation for readable', function( ){
    var opts = {}
    var InputModule = require('../../input/console.js')
    var currInput = new InputModule(opts)
    streamTests.readableStreamSpecUnpausable(currInput) //TODO is process.stdin not pausable?
  })
})

