/* 
    convert a log event to JSON
*/

'use strict';

/*  
    Import moment date manipulation library
    @see https://github.com/timrwood/moment
    @requires
*/
var moment = require('moment')


function parseTime(string, parser) {
  var timestamp = moment(string, parser)
  // if there is no year in the timestamp regex set it to this year
  if (! parser.match(/YY/))
    timestamp.year(moment().year())
  return timestamp.valueOf()
}


/*
    parse an event using the supplied parser
    @param {String} event The event to parse, which may be one or more lines
    @param {RegExp} parser The regular expression parser to use on the event
    @param {Array} labels The labels to give the matched items
    @param {RegExp} timeParser The regular expression parser to use for the timestamp
    @param {Function} callback(error, results) The callback to call when completed
*/
var parseSync = function (event, parser, labels, timeParser, callback) {
  var result = {}
  var error = ''
  try {
    var parsed = parser.exec(event)
    if (parsed) {
      for (var i = 1; i < parsed.length; i++) {
        if (timeParser !== '' && labels[i - 1] === 'timestamp')
          result[labels[i - 1]] = parseTime(parsed[i], timeParser)
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

var parse = function (event, parser, labels, timeParser, callback) {
  var result = {}
  var error = ''
  try{
    result = parseSync(event, parser, labels, timeParser, callback)
  }
  catch (err){
    error = err;
  }
  callback(error, result)
}

module.exports.parse = parse;
module.exports.parseSync = parseSync;
