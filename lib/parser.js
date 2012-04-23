/*jslint  node: true, white: true */
/*jshint  node: true, indent: 2, globalstrict: true, asi: true */

/* 
    convert a log event to JSON
*/

'use strict';

/*
    parse an event using the supplied parser
    @param {String} event The event to parse, which may be one or more lines
    @param {RegExp} parser The regular expression parser to use
    @param {Array} labels The labels to give the matched items
    @param {Function} callback(error, results) The callback to call when completed
*/
module.exports.parse = function (event, parser, labels, callback) {
  var result = {}
  var error = ''
  try {
    var parsed = parser.exec(event)
    if (parsed) {
      for (var i = 1; i < parsed.length; i++)
        result[labels[i - 1]] = parsed[i]
    }
    else {
      error = 'Error parsing event: ' + event
    }
  }
  catch (err) {
    error = err.message
  }
  callback(error, result)
}