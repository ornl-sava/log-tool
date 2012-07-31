'use strict';

// require node core modules and dependencies
var fs = require('fs')
  , path = require('path')
  , tako = require('tako')
  , gzip = require('tako-gzip')
  , redis = require('redis')

// global variables
var app = tako()
  , indexHtml = fs.readFileSync(path.join(__dirname, './html/index.html')).toString()
  , notfoundHtml = fs.readFileSync(path.join(__dirname, './html/notfound.html')).toString()
  , redisClient = redis.createClient()

var channels = ['firewall', 'ids', 'nessus', 'misc']

// gzip all requests
app.on('request', gzip)

// static files
app.route('/public/*').files(path.join(__dirname, './public'))
app.route('/js/*').files(path.join(__dirname, './public/js'))
app.route('/css/*').files(path.join(__dirname, './public/css'))

// routes
app.route('/')
  .html(renderIndex)
  .methods('GET')

// page not found
app.notfound(notfoundHtml)

// listen
app.httpServer.listen(8000)
app.httpsServer.listen(8001)

// listen to redis pubsub
redisClient.on('subscribe', function (channel, count) {
  log('subscribed to channel ' + channel)
})

// To slow down the data flow, set the 0 in wait to X ms (i.e. 1000)
var numThreads = 0
var wait = numThreads * 0
redisClient.on('message', function (channel, message) {
  // slowing down the messages (TODO this is for testing only)
  numThreads++
  setTimeout(function() {  
    app.sockets.emit(channel, message)
    numThreads--
  }, wait)
})

// for development/testing, use 'events' channel to show from log tool
redisClient.subscribe('events')
// and now the 'real' channels
for(var i=0; i< channels.length; i++){
  redisClient.subscribe('events.' + channels[i])
}

// logging function
function log(message) {
  console.log(message)
}

// render page functions
function renderIndex(req, res) {
  res.end(indexHtml)
}
