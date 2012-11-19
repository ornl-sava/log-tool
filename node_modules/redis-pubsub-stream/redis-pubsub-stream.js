/*
  This module will transform a string into JSON string
  It will input a stream, parse it according to a 
  regular expression and output to a stream
*/

'use strict';

var Stream = require('stream').Stream
  , util = require('util')
  , redis = require('redis')

var verbose = false //TODO meh.

module.exports = RedisPubsubStream

//RedisPubsubStream constructor available options: 
//  opts.channel        //name of the channel to publish messages
//  opts.serverAddress  //address of redis server
//  opts.serverPort     //port of redis server
//  opts.redisOpts      //see https://github.com/mranney/node_redis#rediscreateclientport-host-options for options.
function RedisPubsubStream (opts) {
  this.writable = true
  this.readable = true

  this._paused = this._ended = this._destroyed = false

  this._buffer = ''

  Stream.call(this)

  if (!opts)
    opts = {}
  if (!opts.serverPort)
    opts.serverPort = 6379
  if(!opts.serverAddress)
    opts.serverAddress = "localhost"
  if(opts.channel)
    this.channel = opts.channel
  else
    this.channel = "Default"
  var redisOpts = {}
  if(opts.redisOpts) redisOpts = opts.redisOpts

  this.redisClient = redis.createClient(opts.serverPort, opts.serverAddress, redisOpts)

  return this
}

util.inherits(RedisPubsubStream, Stream)

// assumes UTF-8
RedisPubsubStream.prototype.write = function (record) {
  // cannot write to a stream after it has ended
  if ( this._ended ) 
    throw new Error('RedisPubsubStream: write after end')

  if ( ! this.writable ) 
    throw new Error('RedisPubsubStream: not a writable stream')
  
  if ( this._paused ) 
    return false

  if(verbose){ 
    console.log('publish to redis channel: ' + this.channel + ', message: ' + util.inspect(record))
  }
  //TODO callback need to do anything?
  this.redisClient.publish(this.channel, JSON.stringify(record), function (err, res){  })
  
  return true  
}

RedisPubsubStream.prototype.end = function (str) {
  if ( this._ended ) return
  
  if ( ! this.writable ) return
  
  if ( arguments.length )
    this.write(str)
  
  this._ended = true
  this.readable = false
  this.writable = false

  this.emit('end')
  this.emit('close')
}

RedisPubsubStream.prototype.pause = function () {
  if ( this._paused ) return
  
  this._paused = true
  this.emit('pause')
}

RedisPubsubStream.prototype.resume = function () {
  if ( this._paused ) {
    this._paused = false
    this.emit('drain')
  }
}

RedisPubsubStream.prototype.destroy = function () {
  if ( this._destroyed ) return
  
  this._destroyed = true
  this._ended = true

  this.readable = false
  this.writable = false

  this.emit('end')
  this.emit('close')
}

RedisPubsubStream.prototype.flush = function () {
  this.emit('flush')
}
