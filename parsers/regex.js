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

module.exports = RegexStream

//actual RegexStream constructor
function RegexStream (regexConfig) {
  
  this._appName = require('../package').name

  this.writable = true
  this.readable = true

  this._paused = this._ended = this._destroyed = false

  this._buffer = ''

  this._linecount = 0 //for debugging
  
  // set up static errors
  this._errorBadConfig = new Error(this._appName + ': ' + 'regular expression configuration incorrect.')
  this._errorWriteAfterEnd = new Error(this._appName + ': ' + 'attempt to write to a stream that has ended.')
  this._errorUnwritable = new Error(this._appName + ': ' + 'attempt to write to a stream that is not writable.')
  
  
  // set up options for parsing using a regular expression
  if ( typeof regexConfig !== 'undefined' ) {
    // if a regular expression config is defined, all of the pieces need to be defined
    if ( typeof regexConfig.regex === 'undefined' ) {
      this._hasRegex = false
      this.emit('error', this._errorBadConfig)
    }
    else {
      this._hasRegex = true
      
      // required
      this._regex = new RegExp(regexConfig.regex)
      this._labels = regexConfig.labels
      
      // optional
      this._delimiter = new RegExp(regexConfig.delimiter || '\n') // default to split on newline
      this._fieldsRegex = regexConfig.fields || {}

    }
  }
  else {
    this._hasRegex = false  // there is no regular expression
  }

  Stream.call(this)
  
  return this
}

util.inherits(RegexStream, Stream)


// assumes UTF-8
RegexStream.prototype.write = function (data) {
  // cannot write to a stream after it has ended
  if ( this._ended ) 
    throw new Error('RegexStream: write after end')

  if ( ! this.writable ) 
    throw new Error('RegexStream: not a writable stream')
  
  if ( this._paused ) 
    return false

  //always prepend whatever you have.
  data = this._buffer + data
  this._buffer = '';

  var lines = data.split(this._delimiter);

  //always save the last item.  the end method will always give us a final newline to flush this out.
  this._buffer = lines.pop()

  // loop through each all of the lines and parse
  for ( var i = 0 ; i < lines.length ; i++ ) {
    if(lines[i] !== ""){
      try {
        // parse each line and emit the data (or error)
        if ( this._hasRegex ) {
          var result = this._parseString(lines[i])
          //console.log( 'got a result of: ' + JSON.stringify(result))
          this.emit('data', result)
        }else{
          // just emit the original data
          this.emit('data', lines[i])
        }
      }catch (err){
        //console.log('some error emitted for some reason: ' + err)
        var error = new Error('RegexStream: parsing error - ' + err)
        this.emit('error', error)
      }
    }
    this._linecount += 1
  }
  
  return true  
}

// callback is just used for testing.  throws whatever errors it wants.
RegexStream.prototype._parseString = function (data) {
  var result = {}
  var error = ""
  var label
  var j
  var parsed

  parsed = this._regex.exec(data)

  for ( j = 1 ; j < parsed.length ; j++ ) {
    label = this._labels[j - 1]
    
    // if a special field parser has been defined, use it - otherwise append to result
    if ( this._fieldsRegex.hasOwnProperty(label) ) {
      if ( this._fieldsRegex[label].type === 'moment' ){
        result[label] = this._parseMoment(parsed[j], this._fieldsRegex[label].regex)
      }else{
        //console.log('error! ' + error)//TODO debugging
        throw new Error(this._appName + ': ' + this._fieldsRegex[label].type + ' is not a defined type.')
      }
    }
    else {
      result[label] = parsed[j]
    }
  }

  if( result === {}){
    //console.log('error!!!!!!!!!!! ')//TODO debugging
    throw new Error(this._appName + ': error parsing string\n  Line ' + this._linecount + ': ' + data + '\n  Parser: ' + this._regex + ' result was null')
  }

  return result
}

// Uses [Moment.js](http://momentjs.com/) to parse a string into a timestamp
// @return {Number} timestamp The number of *milliseconds* since the Unix Epoch
RegexStream.prototype._parseMoment = function (string, formatter) {

  // set to UTC by adding '+0000' to input string and 'ZZ' to format string
  //TODO regex below won't work if you specify a non-UTC time in incoming regex?
  if (! formatter.match(/\+Z+/) ) {
    string = string + '+0000'
    formatter = formatter + 'ZZ'
  }

  try {
    // parse using the formatter for moment
    var timestamp = moment(string, formatter)

    // if there is no year in the timestamp regex set it to this year
    if (! formatter.match(/YY/))
      timestamp.year(moment().year())

    return timestamp.valueOf()
    
  }
  catch (err) {
    this.emit('error', new Error(this._appName + ': Timestamp parsing error. ' + err))
  }

  return false
}

RegexStream.prototype.end = function (str) {
  if ( this._ended ) return
  
  if ( ! this.writable ) return //TODO ??
  
  if ( arguments.length ){
    this.write(str)
  }

  //since we're done, presumably this is a single, complete item remaining in the buffer, so handle it.
  if(this._buffer !== ""){
    var result = this._parseString(this._buffer)
    this._buffer = ''
    this.emit('data', result)
  }

  this._ended = true
  this.readable = false
  this.writable = false

  this.emit('end')
  this.emit('close')
}

RegexStream.prototype.pause = function () {
  if ( this._paused ) return
  
  this._paused = true
  this.emit('pause')
}

RegexStream.prototype.resume = function () {
  if ( this._paused ) {
    this._paused = false
    this.emit('drain')
  }
}

RegexStream.prototype.destroy = function () {
  if ( this._destroyed ) return
  
  this._destroyed = true
  this._ended = true

  this.readable = false
  this.writable = false

  this.emit('end')
  this.emit('close')
}

RegexStream.prototype.flush = function () {
  this.emit('flush')
}
