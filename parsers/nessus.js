/*global module:true, require:true, console:true, process:true */

/*
  This module parses nessus results
  NB: the file will contain many literal "\n"s, so must pass this only complete lines
*/

'use strict';

var Stream = require('stream').Stream
  , util = require('util')

var NullThroughStream = require('./null.js').NullThroughStream

//wrapper, so core.js has consistant interface
exports.module = function(opts){
  var self = this;
  self.stream = new NessusStream (opts)
  /*
  self.data = function(opts){
  }

  self.end = function(opts){
  }*/
}

//actual NullThroughStream constructor, which does all actual work
function NessusStream (opts) {
  this.writable = true
  this.readable = true

  this._paused = this._ended = this._destroyed = false

  this._buffer = ''

  //Stream.call(this)
  NullThroughStream.call(this)
  
  return this
}

util.inherits(NessusStream, NullThroughStream)

// assumes UTF-8
NessusStream.prototype.write = function (data) {
  // cannot write to a stream after it has ended
  if ( this._ended ) 
    throw new Error('NessusStream: write after end')

  if ( ! this.writable ) 
    throw new Error('NessusStream: not a writable stream')
  
  if ( this._paused ) 
    return false

  // this._buffer has any remainder from the last stream, prepend to the first of lines
  if ( this._buffer !== '') {
    data = this._buffer + data
    this._buffer = '';
  }

  var lines = data.split( '\n' )

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
      this.emit('data', error)
    }
  }
  
  //TODO can this lead to duplicate events of partial-line, then full-line?
  // if not at end of file, save this line into this._buffer for next time
  if ( lines.length > 1 && this.readable )
    this._buffer = lines.pop()
  
  return true  
}

/**
 * Parses a nessus result line and handles missing fields.
 * @param nessStr - nbe result string line
 * @return - structure containing the ip, vulnid, vulntype, cvss and port
 */
NessusStream.prototype.parseNessusResult = function(nessStr){
    var scoreReg = /CVSS Base Score : (\d+\.\d+)/;

    var portReg = /\D+ \((\d{1,7})\D+\)/;
    var splitNess = nessStr.split("|");
    var ip = splitNess[2];
    var code = parseFloat(splitNess[4]);
    var holeNote = splitNess[5];
    if(scoreReg.test(nessStr)){
        var score = parseFloat(scoreReg.exec(nessStr)[1]);
    }
    else{
        var score = 1.0;
    }
    if(portReg.test(nessStr)){
        var port = parseFloat(portReg.exec(nessStr)[1]);
    }
    else{
        var port = 'notes';
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

/**
 * @param nbe - a string representing the contents of a NBE file.
 * @return - array where each entry is a result from the NBE file.
 */
/*
NessusStream.prototype.parseNBEFile = function(nbe){
    var lines = nbe.split("\n")
    var currentTime = 0
    var returnArray = new Array(2)

    for(var i = 0; i < lines.length; i++){
        if(isResult(lines[i])){
            returnArray.push(parseNessusResult(lines[i]))
        }
    }
    return returnArray.filter(function(){return true});//removes nulls
}
*/
//module.exports.parseNessusResult = parseNessusResult;
//module.exports.parseNessusTimeStamp = parseNessusTimeStamp;
//module.exports.parseNBEFile = parseNBEFile;
