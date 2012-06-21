var assert = require('chai').assert; //like node's assert, but better.
var logGenerator = require('./logGenerator');

var fs = require('fs')
  , path = require('path')
  , redis = require('redis')

var app = require('../lib/')

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

/*
describe("Testing the log reading and redis output",function(){

});
*/

describe("Testing redis pubsub",function(){
  //TODO real testing.

  it('Should connect to redis pubsub',function(done){
    var msgCount = 0;

    //set up connection
    var redisClient = redis.createClient()
    // listen to redis pubsub
    redisClient.on('subscribe', function (channel, count) {
      //log('subscribed to channel ' + channel)
    })
    redisClient.on('message', function (channel, message) {
      msgCount += 1;
    })
    redisClient.subscribe('events')
  
    //start process
    app.init()
    app.start()
    
    logGenerator.sleep(5000, function(){ // 'instant' + extra for IO
      console.log("message count was " + msgCount );
      assert.equal( msgCount, 26 ); //17 fw (short), 7 ids, + 2?? //TODO: what?
      //assert.equal( msgCount, 1339 ); //652 fw (1m), 7 ids, + 2?? //TODO: what?
      done();
    });

  });
});

describe("Testing the log generator",function(){

  it('Log sizes should match - "instant" firewall log version',function(done){
    var sizeDelta = 19; //numLines + 2 //TODO this is kinda hacky...
    var logFile = "./test/data/firewall-vast12-instant.csv"
    var logCopy = "./test/tempData/firewall-vast12-instant.csv"
    if (path.existsSync(logCopy)) {
      fs.unlinkSync(logCopy); 
    }
    logGenerator.generate(logFile, logCopy);
    logGenerator.sleep(1000, function(){ // 'instant' + extra for IO
      var oldSize = fs.statSync(logFile).size;
      var newSize = fs.statSync(logCopy).size;
      assert.isTrue( (Math.abs(oldSize-newSize) < sizeDelta) );
      done();
    });
  });

  it('Log sizes should match - "fast" firewall log version',function(done){
    var sizeDelta = 19; //numLines + 2 //TODO this is kinda hacky...
    var logFile = "./test/data/firewall-vast12-fast.csv"
    var logCopy = "./test/tempData/firewall-vast12-fast.csv"
    if (path.existsSync(logCopy)) {
      fs.unlinkSync(logCopy); 
    }
    logGenerator.generate(logFile, logCopy);
    //assert.isFalse( (Math.abs(oldSize-newSize) < sizeDelta) );
    logGenerator.sleep(7000, function(){ //check if done early
      var oldSize = fs.statSync(logFile).size;
      var newSize = fs.statSync(logCopy).size;
      assert.isFalse( (Math.abs(oldSize-newSize) < sizeDelta) );
    });
    logGenerator.sleep(10000, function(){ //9 sec. + extra for IO
      var oldSize = fs.statSync(logFile).size;
      var newSize = fs.statSync(logCopy).size;
      assert.isTrue( (Math.abs(oldSize-newSize) < sizeDelta) );
      done();
    });
  });

  it('Log sizes should match - "1 minute" firewall log version',function(done){
    var sizeDelta = 654; //numLines + 2 //TODO this is kinda hacky...
    var logFile = "./test/data/firewall-vast12-1m.csv"
    var logCopy = "./test/tempData/firewall-vast12-1m.csv"
    if (path.existsSync(logCopy)) {
      fs.unlinkSync(logCopy); 
    }
    logGenerator.generate(logFile, logCopy);
    //assert.isFalse( (Math.abs(oldSize-newSize) < sizeDelta) );
    logGenerator.sleep(55000, function(){ //check if done early
      var oldSize = fs.statSync(logFile).size;
      var newSize = fs.statSync(logCopy).size;
      assert.isFalse( (Math.abs(oldSize-newSize) < sizeDelta) );
    });
    logGenerator.sleep(61000, function(){ //60 sec. + extra for IO
      var oldSize = fs.statSync(logFile).size;
      var newSize = fs.statSync(logCopy).size;
      assert.isTrue( (Math.abs(oldSize-newSize) < sizeDelta) );
      done();
    });
  });

});
