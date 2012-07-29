var spec = require('stream-spec')

var writableStreamSpec = exports.writableStreamSpec = function (stream) {
  var s = spec(stream).writable().drainable()

  stream.write('write test')
  stream.end('end test')
  
  //s.validate()
  //s.validateOnExit()
  setTimeout(s.validateOnExit, 50) //without this, I think validateOnExit runs before the 'end' event occurs? (speculation)
    //TODO look into above issue further ...
}

var readableStreamSpec = exports.readableStreamSpec = function (stream) {
  var s = spec(stream, {end: false, strict: true}).readable().pausable()
  
  stream.destroy()
  setTimeout(s.validateOnExit, 50) //without this, I think validateOnExit runs before the 'end' event occurs? (speculation)
    //TODO look into above issue further ...
}

var throughStreamSpec = exports.throughStreamSpec = function (stream) {
  var s = spec(stream).through({strict: true})

  stream.write('write test')
  stream.end('end test')
  
  s.validate()
}

