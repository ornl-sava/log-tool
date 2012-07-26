var spec = require('stream-spec')

suite("Testing input module: console",function(){
  test('testing against stream spec', function( done ){
    var opts = {}
    var inputModule = require('../../input/console.js')
    var currInput = new inputModule.module(opts)
    var stream = currInput.stream
    spec(stream)
      .readable()
      .pausable({strict: false}) //strict is optional.
      //.validateOnExit() //TODO
    done()
  })
})
