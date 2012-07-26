var spec = require('stream-spec')

suite("Testing input module: watch-file",function(){
  test('testing against stream spec', function( done ){
    var opts = { "fileName":"in.txt", "encoding":"utf-8"} 
    var inputModule = require('../../input/file.js')
    var currInput = new inputModule.module(opts)
    var stream = currInput.stream
    spec(stream)
      .readable()
      .pausable({strict: false}) //strict is optional.
      //.validateOnExit() //TODO
    done()
  })
})
