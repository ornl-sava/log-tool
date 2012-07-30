'use strict';

// require node core modules and dependencies
var fs = require('fs')
  , path = require('path')
  , tako = require('tako')
  , gzip = require('tako-gzip')

// global variables
var app = tako()
  , indexHtml = fs.readFileSync(path.join(__dirname, './html/index.html')).toString()
  , notfoundHtml = fs.readFileSync(path.join(__dirname, './html/notfound.html')).toString()

// gzip all requests
app.on('request', gzip)

// static files
app.route('/public/*').files(path.join(__dirname, './public'))

// routes
app.route('/')
  .html(renderIndex)
  .methods('GET')

// page not found
app.notfound(notfoundHtml)

// listen
app.httpServer.listen(8000)
app.httpsServer.listen(8001)


// render page functions
function renderIndex(req, res) {
  res.end(indexHtml)
}
