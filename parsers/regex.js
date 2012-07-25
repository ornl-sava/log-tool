'use strict';

/*  
    Import moment date manipulation library
    @see https://github.com/timrwood/moment
    @requires
*/
var moment = require('moment')

var es = require('event-stream')

exports.module = function(opts){
  var self = this;

  self.rex = new RegExp(opts.regex)
  self.labels = opts.labels
  self.timeRex = opts.timestamp //TODO inconsistant with others ...
  self.delimiter = new RegExp(opts.delimiter)
  self.startTimeOffset = opts.startTimeOffset

  self.oldBuf = "";

  self.data = function(data){
    if(self.oldBuf && self.oldBuf !== ""){
      data = self.oldBuf + data
      self.oldBuf = null;
    }

    var lines = data.split(self.delimiter);

    if(lines.length > 1 && self.stream.readable){ //if not at end of file, save this line. //TODO needs more testing with longer files.
      self.oldBuf = lines.pop()
    }
    console.info(JSON.stringify(lines))
    for(var line in lines){
      var res = parseSync(lines[line], self.rex, self.labels, self.timeRex)
      this.emit('data', JSON.stringify(res) + '\n') //TODO remove stringify, only needed to test...
      //this.emit('data', 'and also ' + lines[line] + '\n')
    }
  }

  self.end = function(){
    this.emit('end')
  }

  self.stream = es.through(self.data, self.end)
}


function parseTime(string, rex) {
  var timestamp = moment(string+"+0000", rex+"ZZ")
  // if there is no year in the timestamp regex set it to this year
  if (! rex.match(/YY/))
    timestamp.year(moment().year())
  return timestamp.valueOf()
}

/*
    parse an event using the supplied regex
    @param {String} event The event to parse, which may be one or more lines
    @param {RegExp} rex The regular expression to use on the event
    @param {Array} labels The labels to give the matched items
    @param {RegExp} timeRex The regular expression to use for the timestamp
*/
var parseSync = function (event, rex, labels, timeRex) {
  var result = {}
  var error = ''
  try {
    var parsed = rex.exec(event)
    if (parsed) {
      for (var i = 1; i < parsed.length; i++) {
        if (timeRex !== '' && labels[i - 1] === 'timestamp')
          result[labels[i - 1]] = parseTime(parsed[i], timeRex)
        else 
          result[labels[i - 1]] = parsed[i]
      }
    }
    else {
      error = 'Error parsing event\n  Event: ' + event + '\n  Parser: ' + rex
    }
  }
  catch (err) {
    error = err
  }

  if(error === "")
    return result
  else{
    throw new Error(error)
    return null;
  }
}

/*
    parse an event using the supplied regex
    @param {String} event The event to parse, which may be one or more lines
    @param {RegExp} rex The regular expression to use on the event
    @param {Array} labels The labels to give the matched items
    @param {RegExp} timeRex The regular expression to use for the timestamp
    @param {Function} callback(error, results) The callback to call when completed
*/
var parse = function (event, rex, labels, timeRex, callback) {
  var result = {}
  var error = ''
  try{
    result = parseSync(event, rex, labels, timeRex)
  }
  catch (err){
    error = err;
  }
  callback(error, result)
}

