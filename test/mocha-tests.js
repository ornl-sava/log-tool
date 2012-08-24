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
      "infile":{
        "module":"file",
        "fileName":"test/data/firewall-vast12-1m.csv",
        "encoding":"utf-8",
        "bufferSize": 1024 *16 // 1024*64 is default.
      }
    }
    opts.outputConfig = {
      "outfile":{
        "module":"file",
        "fileName":"out.fw.txt"
      }
    }
    opts.parserConfig = {
      "null":{
        "module":"null"
      }
    }
    opts.connectionConfig = [
      {
        "input" :"infile",
        "parser":"null",
        "output":"outfile"
      }
    ]
    var instance = new core.LogTool(opts)
    var check = function(){
      var input = fs.readFileSync(opts.inputConfig["infile"].fileName, "utf-8")
      var result = fs.readFileSync(opts.outputConfig["outfile"].fileName, "utf-8")
      //console.log('input: ' + input)
      //console.log('result: ' + result)
      assert(input)
      assert(result)
      assert(input === result)
      done()
    }
    instance.on("done", check);
  })

  test('should read a file, use regex parser to break up its lines', function( done ){
    var opts = {}
    opts.inputConfig = {
      "in.txt":{
        "module":"file",
        "fileName":"in.txt",
        "encoding":"utf-8",
        "bufferSize": 1024 *16 // 1024*64 is default.
      }
    }
    opts.outputConfig = {
      "out.txt":{
        "module":"file",
        "fileName":"out.txt"
      }
    }
    opts.parserConfig = {
      "line-regex":{
        "module":"regex"
      , "regex": "^(.*)"
      , "labels": ["line"]
      , "fields": {  }
      , "delimiter": "\r\n|\n"
      , "startTime":0
      }
    }
    opts.connectionConfig = [
      {
        "input" :"in.txt",
        "parser":"line-regex",
        "output":"out.txt"
      }
    ]
    var instance = new core.LogTool(opts)
    var check = function(){
      var input = fs.readFileSync("in.txt", "utf-8").split('\n')
      var result = fs.readFileSync("out.txt", "utf-8").split('\n')
      //console.log('input: ' + input)
      //console.log('result: ' + result)
      assert(input)
      assert(result)
      assert(input[0] === JSON.parse(result[0]).line)
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
        "encoding":"utf-8",
        "bufferSize": 1024 *5 // 1024*64 is default.
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
            assert(replies.length === 132)
            client.get("logtool:events:nessus:100", function(err, reply){
              assert(!err)
              assert(reply === "{\"ip\":\"172.16.247.129\",\"vulnid\":11219,\"vulntype\":\"note\",\"cvss\":1,\"value\":1,\"port\":3632}")
              done()
            })
          })
        }
        instance.on("done", function(){ setTimeout(check, 20) }); //otherwise we might check before LogTool's queue to redis has emptied

      })
    })
  })

  //TODO move this test to appropriate module later
  test('should parse firewall file w regex module, and then populate redis', function( done ){
    var opts = {}
    opts.inputConfig = {
      "firewall-vast12":{
        "module":"file",
        "fileName":"test/data/firewall-vast12-1m.csv",
        "encoding":"utf-8",
        "bufferSize": 1024 *16 // 1024*64 is default.
      }
    }
    opts.outputConfig = {
      "fw-pubsub": {
        "module"        : "redis-pubsub",
        "serverAddress" : "127.0.0.1",
        "serverPort"    : 6379,
        "channel"       : "events.firewall"
      },
      "fw-store": {
        "module"        : "redis",
        "serverAddress" : "127.0.0.1",
        "serverPort"    : 6379,
        "keyPrefix"     : "logtool:events:firewall",
        "index"         : false, //true
        "indexedFields" : ["direction", "operation", "priority", "protocol", "sourceIP", "destIP", "sourcePort", "destPort"]
      }
    }
    opts.parserConfig = {
      "firewall":{
        "module":"regex"
      , "regex": "^([^,]*),([^,]*)"//,([^,]+),([^,]+)"//,([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*)"
      , "labels": ["timestamp", "priority"//, "operation", "messageCode", 
                    //"protocol", "sourceIP", "destIP", "sourceHostname", "destHostname", "sourcePort", 
                    //"destPort", "destService", "direction", "connectionsBuilt", "connectionsTornDown"
                  ]
      , "fields": { "timestamp": {"regex": "DD/MMM/YYYY HH:mm:ss", "type": "moment"} }
      , "delimiter": "\r\n|\n"
      , "startTime":0
      },
      "line-regex":{
        "module":"regex"
      , "regex": "^([^,]+).*"
      , "labels": ["line"]
      , "fields": {  }
      , "delimiter": "\r\n|\n"
      , "startTime":0
      }
    }
    opts.connectionConfig = [
      /*{
        "input":"firewall-vast12",
        "parser":"firewall",
        "output":"fw-pubsub"
      },*/
      {
        "input":"firewall-vast12",
        "parser":/*"line-regex",*/"firewall",
        "output":"fw-store"
      }
    ]

    var redis  = require("redis")
    var redisOpts = {} //redis module also uses blank opts.
    var client = redis.createClient(opts.outputConfig['fw-store'].serverPort, opts.outputConfig['fw-store'].serverAddress, redisOpts)

    client.on('ready', function(){
      //client.flushall( function (err) { 
        //assert(!err)
        var instance = new core.LogTool(opts)

        var check = function(){
          client.keys("logtool:events:nessus:*", function (err, replies) {
            assert(!err)
            //assert(replies.length === 139)
            client.get("logtool:events:nessus:100", function(err, reply){
              //assert(!err)
              //assert(reply === "{\"ip\":\"172.16.247.129\",\"vulnid\":53335,\"vulntype\":\"note\",\"cvss\":1,\"value\":1,\"port\":111}")
              done()
            })
          })
        }
        instance.on("done", function(){ setTimeout(check, 20) }); //otherwise we might check before LogTool's queue to redis has emptied

      //})
    })
  })

});

