/*global module:true, require:true, console:true, process:true */

/*
  This module does nothing but pass events through.
*/

'use strict';

var Stream = require('stream').Stream
  , util = require('util')

//wrapper, so core.js has consistant interface
exports.module = function(opts){
  var self = this;
  self.stream = new NullThroughStream (opts)
  /*
  self.data = function(opts){
  }

  self.end = function(opts){
  }*/
}

//actual NullThroughStream constructor, which does all actual work
function NullThroughStream (opts) {
  this.writable = true
  this.readable = true

  this._paused = this._ended = this._destroyed = false

  this._buffer = ''

  Stream.call(this)
  
  return this
}

exports.NullThroughStream = NullThroughStream
util.inherits(NullThroughStream, Stream)

// assumes UTF-8
NullThroughStream.prototype.write = function (str) {
  // cannot write to a stream after it has ended
  if ( this._ended ) 
    throw new Error('NullThroughStream: write after end')

  if ( ! this.writable ) 
    throw new Error('NullThroughStream: not a writable stream')
  
  if ( this._paused ) 
    return false
  
  var self = this

  // just emit the original data
  self.emit('data', str)
  
  return true  
}

NullThroughStream.prototype.end = function (str) {
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

NullThroughStream.prototype.pause = function () {
  if ( this._paused ) return
  
  this._paused = true
  this.emit('pause')
}

NullThroughStream.prototype.resume = function () {
  if ( this._paused ) {
    this._paused = false
    this.emit('drain')
  }
}

NullThroughStream.prototype.destroy = function () {
  if ( this._destroyed ) return
  
  this._destroyed = true
  this._ended = true

  this.readable = false
  this.writable = false

  this.emit('end')
  this.emit('close')
}

NullThroughStream.prototype.flush = function () {
  this.emit('flush')
}
