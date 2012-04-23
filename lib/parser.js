/*jslint  node: true, white: true */
/*jshint  node: true, indent: 2, globalstrict: true, asi: true */

/* 
    convert log record to JSON
*/

'use strict';

module.exports.parse = function (event, parser, labels, callback) {
  var result = {}
  var parsed = parser.exec(event)
  if (typeof result !== 'undefined') {
    for (var i = 1; i < parsed.length; i++) {
      result[labels[i - 1]] = parsed[i]
    }
  }
  
  var err = (!result) ? 'error: unable to parse event\n' + event : null
  callback(err, result)
}