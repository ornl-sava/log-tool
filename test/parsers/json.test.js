//TODO non-working

//example via john

var JSONStream = require('JSONStream')

var input = require('fs').createReadStream('./in.json', {encoding:'utf-8'})
  , parser = JSONStream.parse([true, 't'])
  , stringify = JSONStream.stringify()
  , output = process.stdout

input.resume()
input.pipe(parser).pipe(stringify).pipe(output)


in.json:
[{"name":"ab", "t":123}, {"name":"cd", "t":456}, {"name":"ef", "t":789}]
