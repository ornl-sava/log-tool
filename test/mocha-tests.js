var assert = require('chai').assert; //like node's assert, but better.
var logGenerator = require('./logGenerator');

// require node core modules and dependencies
//  c&p from vis proj, probably don't need most of this.
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
  // Test 1
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

  it('Testing that log sizes match - "instant" log version',function(done){
    var sizeDelta = 64; //TODO this is kinda hacky...
    logGenerator.generate("./test/data/firewall-vast12-instant.csv", "./test/tempData/firewall-vast12-instant.csv");
    var oldSize = fs.statSync("./test/data/firewall-vast12-instant.csv").size;
    var newSize = fs.statSync("./test/tempData/firewall-vast12-instant.csv").size;
    assert.isTrue( (Math.abs(oldSize-newSize) < sizeDelta) );
    logGenerator.sleep(100, function(){
      done();
    });
  });

  it('Testing that log sizes match - "fast" log version',function(done){
    var sizeDelta = 64; //TODO this is kinda hacky...
    fs.unlinkSync("./test/tempData/firewall-vast12-fast.csv");
    logGenerator.generate("./test/data/firewall-vast12-fast.csv", "./test/tempData/firewall-vast12-fast.csv");
    //assert.isFalse( ((oldSize-newSize)<sizeDelta) || ((newSize-oldSize)<sizeDelta) );
    logGenerator.sleep(10000, function(){
      var oldSize = fs.statSync("./test/data/firewall-vast12-fast.csv").size;
      var newSize = fs.statSync("./test/tempData/firewall-vast12-fast.csv").size;
      assert.isTrue( ((oldSize-newSize)<sizeDelta) || ((newSize-oldSize)<sizeDelta) );
      done();
    });
  });


});
