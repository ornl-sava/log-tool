var assert = require('chai').assert; //like node's assert, but better.

var fs = require('fs')
  , path = require('path')
  , redis = require('redis')
  , async = require('async')
  , EventEmitter = require('events').EventEmitter
//var app = require('../lib/core')

// logging function
function log(message) {
  console.log(message)
}
/*
suite("Testing input modules",function(){
  //kind of strange that here '.' is proj root dir, but below it is test dir ...
  var files = fs.readdirSync('./test/input') 
  for(var i=0; i< files.length; i++){
    require('./input/' + files[i])
  }
});
*/

suite("Testing output modules",function(){
  var files = fs.readdirSync('./test/output')
  for(var i=0; i< files.length; i++){
    require('./output/' + files[i])
  }
});

suite("Testing parser modules",function(){
  var files = fs.readdirSync('./test/parsers')
  for(var i=0; i< files.length; i++){
    require('./parsers/' + files[i])
  }
})

suite("Integration Tests",function(){
  var core = require('../lib/core.js')
  var fs = require('fs')
  
  test('engine should start, init, exit ok', function( done ){
    var opts = {}
    opts.connectionConfig = []
    var instance = new core.LogTool(opts)
    instance.on("done", done);
  })
  
  test('should copy one file to another', function( done ){
    var opts = {}
    opts.inputConfig = {
      "in.txt":{
        "module":"file",
        "fileName":"in.txt",
        "encoding":"utf-8"
      }
    }
    opts.outputConfig = {
      "out.txt":{
        "module":"file",
        "fileName":"out.txt"
      }
    }
    opts.parserConfig = {
      "null":{
        "module":"null"
      }
    }
    opts.connectionConfig = [
      {
        "input" :"in.txt",
        "parser":"null",
        "output":"out.txt"
      }
    ]
    var instance = new core.LogTool(opts)
    var check = function(){
      var input = fs.readFileSync("in.txt", "utf-8")
      var result = fs.readFileSync("out.txt", "utf-8")
      //console.log('input: ' + input)
      //console.log('result: ' + result)
      assert(input)
      assert(result)
      assert(input === result)
      done()
    }
    instance.on("done", check);
  })

  //TODO move this test to appropriate module later
  test('should parse nessus file and populate redis', function( done ){
    var opts = {}
    opts.inputConfig = {
      "nessus-example":{
        "module":"file",
        "fileName":"test/data/metasploitable.2.0.nbe",
        "encoding":"utf-8"
      }
    }
    opts.outputConfig = {
      "nessus-pubsub": {
        "module"        : "redis-pubsub",
        "serverAddress" : "127.0.0.1",
        "serverPort"    : 6379,
        "channel"       : "events.nessus"
      },
      "nessus-store": {
        "module"        : "redis",
        "serverAddress" : "127.0.0.1",
        "serverPort"    : 6379,
        "keyPrefix"     : "logtool:events:nessus",
        "index"         : true,
        "indexedFields" : ["ip", "port", "vulnid"]
      }
    }
    opts.parserConfig = {
      "nessus":{
        "module":"nessus"
      }
    }
    opts.connectionConfig = [
      {
        "input":"nessus-example",
        "parser":"nessus",
        "output":"nessus-pubsub"
      },
      {
        "input":"nessus-example",
        "parser":"nessus",
        "output":"nessus-store"
      }
    ]

    var redis  = require("redis")
    var redisOpts = {} //redis module also uses blank opts.
    var client = redis.createClient(opts.outputConfig['nessus-store'].serverPort, opts.outputConfig['nessus-store'].serverAddress, redisOpts)

    client.on('ready', function(){
      client.flushall( function (err) { 
        assert(!err)
        var instance = new core.LogTool(opts)

        var check = function(){
          client.keys("logtool:events:nessus:*", function (err, replies) {
            assert(!err)
            assert(replies.length === 139)
            client.get("logtool:events:nessus:100", function(err, reply){
              assert(!err)
              assert(reply === "{\"ip\":\"172.16.247.129\",\"vulnid\":53335,\"vulntype\":\"note\",\"cvss\":1,\"value\":1,\"port\":111}")
              done()
            })
          })
        }
        instance.on("done", function(){ setTimeout(check, 20) }); //otherwise we might check before LogTool's queue to redis has emptied

      })
    })
  })

});

