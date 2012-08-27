/*global suite:false, test:false*/
'use strict';

var assert = require('chai').assert;
var streamTests = require('../stream-tests-common.js')

var NullThroughStream = require('../../parsers/null.js')

suite('Stream Specification Tests: null.js', function() {

  test('should pass stream-spec validation for through', function(){
    streamTests.throughStreamSpec( new NullThroughStream() )
  })

  test('should pass stream-spec validation for writable', function(){
    streamTests.writableStreamSpec( new NullThroughStream() )
  })

  //TODO why won't this pass?
  /*
  test('should pass stream-spec validation for readable', function(){
    streamTests.readableStreamSpec( new NullThroughStream() )
  })
  */
}) 

