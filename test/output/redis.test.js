//TODO non-working

/*  
    Import [redis](http://redis.io/) module
    @see https://github.com/mranney/node_redis
    @requires
*/
var redis = require('redis')
  , redisClient

/*
  Send data to redis to persist in the database
  Data sent to redis:
    key-> sensorType:destip where ip is the destination ip (or only ip if not flow)
    value-> {timestamp: event}
  This assumes that for each sensor/ip pair there is only a single timestamp, which may not be the case. May have to have a sequencer or random number here.
  It may be useful instead to have timestamp as part of the key: sensor:destip:timestamp
  @param {Object} record The data to send to redis
*/
/*
var sendRedis = function (record, cb) {
  var key = record.sensorType + ':' + record.destIP
    , val = {}
  val[record.timestamp.toString()] = record
  if(verbose){ 
    console.log('send to redis: ' + key + '  ' + record.timestamp.toString())
  }
  redisClient.hmset(key, val, function (err, res){ cb(err, res) })
}
*/
