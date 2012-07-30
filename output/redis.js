/*global module:true, require:true, console:true, process:true */

/*
  This module will transform a string into JSON string
  It will input a stream, parse it according to a 
  regular expression and output to a stream
*/

'use strict';

var Stream = require('stream').Stream
  , util = require('util')
  , moment = require('moment')
  , redis = require('redis')

var verbose = false //TODO meh.

//wrapper, so core.js has consistant interface
exports.module = function(opts){
  var self = this;
  self.stream = new RedisStream (opts)
  /*
  self.data = function(opts){
  }

  self.end = function(opts){
  }*/
}

//actual RedisStream constructor, which does all actual work
function RedisStream (opts) {
  this.writable = true
  this.readable = true

  this._paused = this._ended = this._destroyed = false

  this._buffer = ''

  Stream.call(this)
  
  this.eventID = 0 //will be appended to end of all keys to guarantee unique.  Counts events.
  this.keyPrefix = opts.keyPrefix
  var redisOpts = {}//see https://github.com/mranney/node_redis#rediscreateclientport-host-options for options.

  this.redisClient = redis.createClient(opts.serverPort, opts.serverAddress, redisOpts)

  return this
}

util.inherits(RedisStream, Stream)

// assumes UTF-8
RedisStream.prototype.write = function (record) {
  // cannot write to a stream after it has ended
  if ( this._ended ) 
    throw new Error('RedisStream: write after end')

  if ( ! this.writable ) 
    throw new Error('RedisStream: not a writable stream')
  
  if ( this._paused ) 
    return false

  var key = this.keyPrefix + ':' + this.eventID

  if(verbose){ 
    console.log('sending to redis: key: ' + key + ', val: ' + util.inspect(record))
  }
  //TODO callback need to do anything?
  this.redisClient.set(key, record, function (err, res){  })

  this.eventID += 1

  return true  
}

RedisStream.prototype.end = function (str) {
  if ( this._ended ) return
  
  if ( ! this.writable ) return
  
  this._ended = true
  this.readable = false
  this.writable = false
  
  if ( arguments.length )
    this.write(str)

  this.emit('end')
  this.emit('close')
}

RedisStream.prototype.pause = function () {
  if ( this._paused ) return
  
  this._paused = true
  this.emit('pause')
}

RedisStream.prototype.resume = function () {
  if ( this._paused ) {
    this._paused = false
    this.emit('drain')
  }
}

RedisStream.prototype.destroy = function () {
  if ( this._destroyed ) return
  
  this._destroyed = true
  this._ended = true

  this.readable = false
  this.writable = false

  this.emit('end')
  this.emit('close')
}

RedisStream.prototype.flush = function () {
  this.emit('flush')
}

