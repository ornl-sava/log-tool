/*
 * nv.js
 *
 *
 * Here are the divs in nv.html:
 * - id=""
 */

var channels = ['firewall', 'ids', 'nessus']//, 'misc']
var socket

function initConnections() {

  // socket.io connection to restricted namespace 'gv'
  var ioHost = window.location.hostname// + '/gv'; 
  var resPath = "socket.io"
  var socketioOptions = 
          { 'transports': ['websocket', 'flashsocket', 'htmlfile', 'xhr-polling', 'jsonp-polling'],
            'try multiple transports': true,
            'resource' : resPath,
            'reconnect': true,
            'reconnection delay': 250
          }

  console.debug( 'attempting to establish socket.io connection to ' + ioHost);
  socket = io.connect(ioHost, socketioOptions)
  
  socket.on('connecting', function(transportType) {
    console.debug( 'socket.io connecting using ' + transportType )
  })

  socket.on('connect', function() {
    console.debug( 'socket.io connection established' )
  })

  socket.on('reconnect', function(transportType, attempts) {
    console.debug( 'socket.io reconnected using ' + transportType + ' on attempt ' + attempts )
  })

  socket.on('reconnect_failed', function() {
    console.debug( 'socket.io was unable to make a connection' )
  })
  
  socket.on('disconnect', function() {
    console.debug( 'socket.io connection lost' )
  })
  
  socket.on('init', function (msg) {
    console.debug( 'socket.io initialization' )
  })

  socket.on('search_results', function (msg) {
    console.debug( 'got search results message: ' + msg )
    var old = $('#searchResultsTextarea').text()
    $('#searchResultsTextarea').text(msg + '\n' + old)
  })
  
  //TODO should have less hardcoding & more code re-use between these remaining message handlers.
  //general events channel, for debugging.
  socket.on('events', function (msg) {
    console.debug( 'got event message on channel events: ' + msg )
  })
  socket.on('events.firewall', function (msg) {
    console.debug( 'got event message on channel events.firewall: ' + msg )
    var old = $('#dataTextarea1').text()
    $('#dataTextarea1').text(msg + '\n' + old)
  })
  socket.on('events.ids', function (msg) {
    console.debug( 'got event message on channel events.ids: ' + msg )
    var old = $('#dataTextarea2').text()
    $('#dataTextarea2').text(msg + '\n' + old)
  })
  socket.on('events.nessus', function (msg) {
    console.debug( 'got event message on channel events.nessus: ' + msg )
    var old = $('#dataTextarea3').text()
    $('#dataTextarea3').text(msg + '\n' + old)
  })
  socket.on('events.misc', function (msg) {
    console.debug( 'got event message on channel events.misc: ' + msg )
    var old = $('#dataTextarea4').text()
    $('#dataTextarea4').text(msg + '\n' + old)
  })
}

// called after data load
function redraw() {
  //TODO needed?
}

// called when window is resized
function resize() {
  //TODO needed?
}

function handleSearch(){
  console.debug("pressed search button");
  var terms = $('#search-query').val()
  socket.emit('search', terms)
}

// initialization
$().ready(function () {
  // set up needed event listeners, etc.
  $('#search-button').bind('click', function(event) {
    handleSearch()
    return false
  })


  //give tabs proper names and descriptions
  for(var i=0; i< channels.length; i++){
    $('#channel'+(i+1)+'Link').text(channels[i])
    $('#channel'+(i+1)+' > .tab-description').text('streaming events on ' + channels[i] + ' channel')
  }

  // start
  initConnections();
});

