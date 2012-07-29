var assert = require('chai').assert; //like node's assert, but better.

var fs = require('fs')
  , path = require('path')
  , redis = require('redis')
  , async = require('async')

var app = require('../lib/core')

// logging function
function log(message) {
  console.log(message)
}

suite("Testing input modules",function(){
  //kind of strange that here '.' is proj root dir, but below it is test dir ...
  var files = fs.readdirSync('./test/input') 

  for(var i=0; i< files.length; i++){
    require('./input/' + files[i])
  }

});

/*
suite("Testing output modules",function(){
  
  var files = fs.readdirSync('./test/output')

  for(var i=0; i< files.length; i++){
    require('./output/' + files[i])
  }

});
*/
suite("Testing parser modules",function(){
  
  var files = fs.readdirSync('./test/parsers')

  for(var i=0; i< files.length; i++){
    require('./parsers/' + files[i])
  }

});

/*
suite("Testing core engine",function(){
  
  //try a few combinations of the modules above?

});
*/
