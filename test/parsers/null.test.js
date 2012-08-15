var assert = require('chai').assert;
var streamTests = require('../stream-tests-common.js')

var RegexStream = require('../../parsers/regex.js')

suite('Stream Specification Tests: null.js', function() {

  test('should pass stream-spec validation for through', function(){
    streamTests.throughStreamSpec( new RegexStream() )
  })

  test('should pass stream-spec validation for writable', function(){
    streamTests.writableStreamSpec( new RegexStream() )
  })

  //TODO why won't this pass?
  /*
  test('should pass stream-spec validation for readable', function(){
    streamTests.readableStreamSpec( new RegexStream() )
  })
  */
}) 

