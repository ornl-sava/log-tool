/*
  This module parses nessus results
*/

'use strict';

var Stream = require('stream').Stream
  , util = require('util')

var NullThroughStream = require('./null.js').NullThroughStream

module.exports = NessusStream

//NessusStream constructor available options: 
//  (none)
function NessusStream (opts) {
  this.writable = true
  this.readable = true

  this._paused = this._ended = this._destroyed = false

  this._buffer = ''

  Stream.call(this)
  
  return this
}

util.inherits(NessusStream, Stream)

// assumes UTF-8
NessusStream.prototype.write = function (data) {
  // cannot write to a stream after it has ended
  if ( this._ended ) 
    throw new Error('NessusStream: write after end')

  if ( ! this.writable ) 
    throw new Error('NessusStream: not a writable stream')
  
  if ( this._paused ) 
    return false

  //always prepend whatever you have.
  data = this._buffer + data
  this._buffer = '';

  var lines = data.split(  /\n/  )

  //always save the last item.  the end method will always give us a final newline to flush this out.
  this._buffer = lines.pop()

  // loop through each all of the lines and parse
  for ( var i = 0 ; i < lines.length ; i++ ) {
    try {
      if(lines[i] !== ""){
        var result = this.parseNessusResult(lines[i])
        this.emit('data', result)
      }
    }
    catch (err){
      var error = new Error('Nessus: parsing error - ' + err)
      this.emit('error', error)
    }
  }
  
  return true  
}

/**
 * Parses a nessus result line and handles missing fields.
 * @param nessStr - nbe result string line
 * @return - structure containing the ip, vulnid, vulntype, cvss and port
 */
NessusStream.prototype.parseNessusResult = function(nessStr){
    var scoreReg = new RegExp("CVSS Base Score : (\\d+\\.\\d+)");

    var portReg = /\D+ \((\d{1,7})\D+\)/;
    var splitNess = nessStr.split("|");
    var ip = splitNess[2];
    var code = parseFloat(splitNess[4]);
    var holeNote = splitNess[5];
    var score;
    var port;
    if(scoreReg.test(nessStr)){
        score = parseFloat(scoreReg.exec(nessStr)[1]);
    }
    else{
        score = 0;//1.0;
    }
    if(portReg.test(nessStr)){
        port = parseFloat(portReg.exec(nessStr)[1]);
    }
    else{
        port = 'notes';
    }
    
    return {"ip": (ip === undefined ? "" : ip),
        "vulnid": (isNaN(code) ? 0 : code),
        "vulntype":(holeNote === undefined ? "" : holeNote.indexOf('Note') !== -1 ? 'note' : 'hole'),
        "cvss": score,
        "value": 1,
        "port":port};
}

/**
 * @param stampString - timestamp line from an NBE file.
 * @return - milliseconds between epoch and the time in the stamp.
 */
NessusStream.prototype.parseNessusTimeStamp = function(stampString){
    var moment = require("moment")
    var timeFormat = "ddd MMM DD HH:mm:ss YYYY"
    var splitInput = stampString.split("|")
    
    var time = moment(splitInput[splitInput.length - 2], timeFormat)
    //var time = splitInput[splitInput.length - 2]
    return time.valueOf()
}

/**
 * @param line - line to be tested.
 * @return - returns true if the line is a time line containing a timestamp.
 */
NessusStream.prototype.hasTime = function(line){
    var splits = line.split("|")
    return (splits[splits.length - 2].length > 0 && splits[0] == "timestamps")
}

/**
 * @param line - line to be tested.
 * @return - returns true if the line is a result line and false otherwise.
 */
NessusStream.prototype.isResult = function(line){
    return(line.split("|")[0] === "results")
}

//Various stream boilerplate functions
NessusStream.prototype.end = function (str) {
  if ( this._ended ) return
  
  if ( ! this.writable ) return
  
  if ( arguments.length ){
    this.write(str)
  }

  //since we're done, presumably this is a single, complete item remaining in the buffer, so handle it.
  if(this._buffer !== ""){
    var result = this.parseNessusResult(this._buffer)
    this._buffer = ''
    this.emit('data', result)
  }

  this._ended = true
  this.readable = false
  this.writable = false

  this.emit('end')
  this.emit('close')
}

NessusStream.prototype.pause = function () {
  if ( this._paused ) return
  
  this._paused = true
  this.emit('pause')
}

NessusStream.prototype.resume = function () {
  if ( this._paused ) {
    this._paused = false
    this.emit('drain')
  }
}

NessusStream.prototype.destroy = function () {
  if ( this._destroyed ) return
  
  this._destroyed = true
  this._ended = true

  this.readable = false
  this.writable = false

  this.emit('end')
  this.emit('close')
}

NessusStream.prototype.flush = function () {
  this.emit('flush')
}
