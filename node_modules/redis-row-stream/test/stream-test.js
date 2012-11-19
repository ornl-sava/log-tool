var RedisRowStream = require('../redis-row-stream.js')
  , fs = require('fs')
  , path = require('path')
  , util = require('util')
  , tester = require('stream-tester')
  , should = require('should')
  , redis = require('redis')
  , reds = require('reds')

describe('redis row stream Tests', function() {

  before(function(done) {
    var outPath = path.join('test', 'output')
    fs.exists(outPath, function(exists) {
      if (exists) {
        fs.readdir(outPath, function(err, files) {
          if ( files && files.length ) {
            for (var i = 0 ; i < files.length ; i++ ) {
              fs.unlink( path.join(outPath, files[i]), function(err) {
                if ( err )
                  throw err
              }) 
            }
          }
          done()
        })
      }
      else {
        fs.mkdir(outPath, 755, function(err) {
          done()
        })
      }
    })
  })

  describe('# simple stream test', function(){
    it('should pass pause-unpause stream tests', function(done){
      pauseUnpauseStream(done)
    })
  })

  describe('# simple data pipe test', function(){
    it('should pass simple objects to redis using specified keys', function(done){
      simpleRowTest(done)
    })
  })

}) 

var pauseUnpauseStream = function (done) {
  var opts = { channel:"pauseUnpauseStreamTest"      //name of the channel to publish messages
      , serverAddress: "localhost"  //address of redis server
      , serverPort:6379     //port of redis server
      , redisOpts: {} }
  tester.createRandomStream(10000) //10k random numbers
    .pipe(tester.createUnpauseStream())
    .pipe(new RedisRowStream(opts))
    .pipe(tester.createPauseStream())  
  setTimeout(function(){
    done()
  }, 1500) //need some time here so that pipelines can empty and whatnot before moving on to other tests
}

var simpleRowTest = function (done) {
  // define the test data and output file
  var inFile = path.join('test', 'input', 'simpleData.json')
    , opts = { keyPrefix:"simpleRowTest"      //prefix to attach to all keys
      , index:false  //if true, will index all results with reds.  Note that this can slow output somewhat.  see https://github.com/visionmedia/reds
      , indexedFields:[] //if above is true, these fields will be indexed
      , serverAddress: "localhost"  //address of redis server
      , serverPort:6379     //port of redis server
      , redisOpts: {} }
    , result = []


  var rc = redis.createClient(opts.serverPort, opts.serverAddress, opts.redisOpts)

  var testStream = new RedisRowStream(opts)

  rc.on('ready', function(){
    rc.flushall( function (err) { 
      should.not.exist(err)
      fs.readFile(inFile, function (err, data) {
        should.not.exist(err)
        data = JSON.parse(data)
        for(var i=0; i<data.length; i++){
          testStream.write(data[i]);
        }

        var check = function(){
          rc.keys(opts.keyPrefix+":*", function (err, replies) {
            should.not.exist(err)
            //console.log('got ' + replies.length + ' replies')
            replies.length.should.eql(3)
            rc.get(opts.keyPrefix+":2", function(err, reply){
              should.not.exist(err)
              reply.should.eql("{\"A label\":\"56\",\"B label\":\"78\",\"C label\":\"90\"}")
              done()
            })
          })
        }
        setTimeout(check, 1500) //need some time here so that pipelines can empty and whatnot 

      })
    })
  })
 
}
