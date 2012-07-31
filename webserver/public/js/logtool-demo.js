/*
 * nv.js
 *
 *
 * Here are the divs in nv.html:
 * - id=""
 */

var channels = ['firewall', 'ids', 'nessus', 'misc']

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
  //socket = io.connect(ioHost, socketioOptions)
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
  
  //TODO should have less hardcoding & more code re-use between these remaining message handlers.
  //general events channel, for debugging.
  socket.on('events', function (msg) {
    console.debug( 'got event message on channel events: ' + msg )
  })
  //general events channel, for debugging.
  socket.on('events.firewall', function (msg) {
    console.debug( 'got event message on channel events.firewall: ' + msg )
    var old = $('#dataTextarea1').text()
    $('#dataTextarea1').text(old + msg + '\n')
  })
  //general events channel, for debugging.
  socket.on('events.ids', function (msg) {
    console.debug( 'got event message on channel events.ids: ' + msg )
    var old = $('#dataTextarea2').text()
    $('#dataTextarea2').text(old + msg + '\n')
  })
  //general events channel, for debugging.
  socket.on('events.nessus', function (msg) {
    console.debug( 'got event message on channel events.nessus: ' + msg )
    var old = $('#dataTextarea3').text()
    $('#dataTextarea3').text(old + msg + '\n')
  })
  //general events channel, for debugging.
  socket.on('events.misc', function (msg) {
    console.debug( 'got event message on channel events.misc: ' + msg )
    var old = $('#dataTextarea4').text()
    $('#dataTextarea4').text(old + msg + '\n')
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

/*
function handleChannelTab1(){
  console.log("channel 1 tab active");
}

function handleChannelTab2(){
  console.log("channel 2 tab active");
}
*/

// initialization
$().ready(function () {
  // set up needed event listeners, etc.
/*
  $('#channel1Link').bind('click', function(event) {
    handleChannelTab1();
  });
  $('#channel2Link').bind('click', function(event) {
    handleChannelTab2();
  });
*/

  //give tabs proper names and descriptions
  for(var i=0; i< channels.length; i++){
    $('#channel'+(i+1)+'Link').text(channels[i])
    $('#channel'+(i+1)+' > .tab-description').text('streaming events on ' + channels[i] + ' channel')
  }

  // start
  initConnections();
});

