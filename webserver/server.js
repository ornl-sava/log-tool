'use strict';

// require node core modules and dependencies
var fs = require('fs')
  , path = require('path')
  , tako = require('tako')
  , gzip = require('tako-gzip')
  , redis = require('redis')
  , reds = require('reds')
  , async = require('async')

// global variables
var app = tako()
  , indexHtml = fs.readFileSync(path.join(__dirname, './html/index.html')).toString()
  , notfoundHtml = fs.readFileSync(path.join(__dirname, './html/notfound.html')).toString()
  , redisClient = redis.createClient() //client for pubsub
  , rc = redis.createClient() //client for queries.  yes, they need to be separate apparently, idk.

var channels = ['firewall', 'ids', 'nessus', 'misc']
var search = reds.createSearch('search');

// gzip all requests
app.on('request', gzip)

// static files
app.route('/public/*').files(path.join(__dirname, './public'))
app.route('/js/*').files(path.join(__dirname, './public/js'))
app.route('/css/*').files(path.join(__dirname, './public/css'))
app.route('/img/*').files(path.join(__dirname, './public/img'))

// routes
app.route('/')
  .html(renderIndex)
  .methods('GET')

// page not found
app.notfound(notfoundHtml)

// listen
app.httpServer.listen(8000)
//app.httpsServer.listen(8001)

//tako has this built in, don't need socket.io
app.sockets.on('connection', function (socket) {
  //app.sockets.emit('search_results', "test post please ignore");
  socket.on('search', function (msg) {
    //app.sockets.emit('search_results', 'got your msg: ' + msg)
    search
      .query(msg)
      .end(function(err, ids){
        if (err) throw err
        console.log('Search results for "%s":', msg)
        var results = []
        async.forEachSeries(ids, function(id, cb){ //using series here will guarantee that order of keys and results matches.
          rc.get(id, function(err, reply) {
            if (err) throw err
            results.push(reply)
            cb()
          })
        }, function(err){
          if (err) throw err
          var resultsString = ''
          for(var i=0; i< results.length; i++){
            resultsString += '  ' + ids[i] + ':\n    ' + results[i] + '\n'
          }
          if(resultsString === ''){
            resultsString = '  (none)'
          }
          app.sockets.emit('search_results', 'for query "' + msg + '" results were: \n'+ resultsString)
        })
  /*
        //ids contains they keys we need, but we want to return their vals.
        ids.forEach(function(id){
          console.log('  - %s', strs[id])
        })
  */

      }, 'union')
  })

})

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
