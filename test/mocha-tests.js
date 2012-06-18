var assert = require('chai').assert; //like node's assert, but better.
var logGenerator = require('./logGenerator');

var fs = require('fs')
  , path = require('path')
  , redis = require('redis')

/*
var io = require('socket.io/node_modules/socket.io-client'); //beats having it installed twice ...

var socketURL = 'http://localhost:8000';

var options ={
  transports: ['websocket'],
  'force new connection': true
};
*/

// logging function
function log(message) {
  console.log(message)
}

describe("Testing the log reading and redis output",function(){

});

describe("Testing redis pubsub",function(){
  //TODO real testing.

  it('Should connect to redis pubsub',function(done){
    
    var redisClient = redis.createClient()
    // listen to redis pubsub
    redisClient.on('subscribe', function (channel, count) {
      //log('subscribed to channel ' + channel)
    })

    redisClient.on('message', function (channel, message) {
      app.sockets.emit('event', message)
    })

    redisClient.subscribe('events')

    done();
  });
});

describe("Testing the log generator",function(){

  it('Log sizes should match - "instant" log version',function(done){
    var sizeDelta = 64; //TODO this is kinda hacky...
    var logFile = "./test/data/firewall-vast12-instant.csv"
    var logCopy = "./test/tempData/firewall-vast12-instant.csv"
    if (path.existsSync(logCopy)) {
      fs.unlinkSync(logCopy); 
    }
    logGenerator.generate(logFile, logCopy);
    logGenerator.sleep(1000, function(){
      var oldSize = fs.statSync(logFile).size;
      var newSize = fs.statSync(logCopy).size;
      assert.isTrue( (Math.abs(oldSize-newSize) < sizeDelta) );
      done();
    });
  });

  it('Log sizes should match - "fast" log version',function(done){
    var sizeDelta = 64; //TODO this is kinda hacky...
    var logFile = "./test/data/firewall-vast12-fast.csv"
    var logCopy = "./test/tempData/firewall-vast12-fast.csv"
    if (path.existsSync(logCopy)) {
      fs.unlinkSync(logCopy); 
    }
    logGenerator.generate(logFile, logCopy);
    //assert.isFalse( (Math.abs(oldSize-newSize) < sizeDelta) );
    logGenerator.sleep(10000, function(){
      var oldSize = fs.statSync(logFile).size;
      var newSize = fs.statSync(logCopy).size;
      assert.isTrue( (Math.abs(oldSize-newSize) < sizeDelta) );
      done();
    });
  });

});
