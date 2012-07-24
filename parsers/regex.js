'use strict';

/*  
    Import moment date manipulation library
    @see https://github.com/timrwood/moment
    @requires
*/
var moment = require('moment')

exports.start = function(opts){
  var regex = opts.regex;
}

exports.data = function(data){
  var res = parseSync(data, rex, labels, timeRex)
  this.emit('data', res)
  /*
  var lines = data.split('\n');
  //NB: for real parsers, don't do this, use es.split( same regex you already have ) or es json equiv.
  for(line in lines){
    this.emit('data', lines[line] + '\n')
    this.emit('data', 'and also ' + lines[line] + '\n')
  }*/
}

exports.end = function(){
  this.emit('end')
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
      error = 'Error parsing event\n  Event: ' + event + '\n  Parser: ' + parser
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

