// Import opts command line options parser module
//  https://bitbucket.org/mazzarelli/js-opts/wiki/Home
var opts = require('opts');

var app = require('./lib/')

app.init()
app.start()

app.stop()
