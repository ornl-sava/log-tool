/*  
    Import [redis](http://redis.io/) module
    @see https://github.com/mranney/node_redis
    @requires
*/
var redis = require('redis')
  , redisClient


/*
  Publish data to redis using publish / subscribe
  @see http://redis.io/topics/pubsub
  @param {Object} record The data to send to redis
*/
var publishRedis = function (record, cb) {
  var channel = 'events' // TODO - this should be configuration option
  if(verbose){ 
    console.log('publish to redis channel: ' + channel + ', message: ' + util.inspect(record))
  }
  redisClient.publish(channel, JSON.stringify(record), function (err, res){ cb(err, res) })
}

