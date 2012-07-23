exports.start = function(opts){
  var input = require('fs').createReadStream('./in.txt', {encoding:'utf-8'})
  return input
}

exports.data = function(opts){

}

exports.end = function(opts){

}





/*
  Watch log file for changes and execute on each new record
  @param {Object} cfg The configuration that includes the log file to process, the parser, the labels, the optional delimiter, the optional timestamp parser
  @param {Boolean} watch Optional parameter to continuously watch a file (default: false)
*/
var processLog = function (cfg, watch) {
  var name = cfg.name
    , file = cfg.file
    , parser = cfg.parser
    , labels = cfg.labels
    , delimiter = cfg.delimiter
    , timeParser = cfg.timeParser

  var scores = {};

  var readline = require('readline');

  var istr = fs.createReadStream('./test/data/scores-slices/slice2.json', {encoding: 'utf8'} ) //TODO handle all chunks
  var ostr = fs.createWriteStream('/dev/null', {encoding: 'utf8'}) 
  //var rl = readline.createInterface({ input: istr, output: ostr });
  var rl = readline.createInterface( istr, ostr );

  rl.on('line', function (line) {
    //console.log('just read: '+line.slice(0,20) +'...')
    try{
      processScoreLine(line, scores)
    }catch (e){
      throw "could not parse line: " + line + "\n" + e.message
    }
    //rl.pause()
  });

  function processScoreLine(line, scores){
    var score = JSON.parse( line.split('\'').join('"') )
    if (cfg.name === 'firewall'){
      if(score.id.slice(0,2) === 'fw')
        scores[score.id.slice(4)] = score
    }else if (cfg.name === 'snort'){
      if(score.id.slice(0,3) === 'ids')
        scores[score.id.slice(5)] = score
    }
  }

  var i=0;
  // function to process a 'line' (based on delimiter) of log file
  function processLine(line, callback) {
    if(line !== ""){ //can get an empty line, typically if file ends with newline.
      eventParser.parse(line, parser, labels, timeParser, function (error, result) {
        if (error)
          callback('Log error for ' + name + '\n' + error)
        // check for non-null results, do any needed processing, and send those
        if( ! result.lineNumber){
          result.lineNumber = i;  //TODO this doesn't work actually
          i += 1;
        }else{
          result.lineNumber = result.lineNumber.slice(13)
        }
        if(scores[result.lineNumber]){
          result.maliceScore = scores[result.lineNumber].maliceScore
          result.anomalyScore = scores[result.lineNumber].anomalyScore
          //these are extra fields that may or may not be used downstream.
          result.hv = scores[result.lineNumber].hv //high value
          result.rv = scores[result.lineNumber].rv //role violation
          result.pv = scores[result.lineNumber].pv //policy violation
          result.tod = scores[result.lineNumber].tod //time of day.  1 = 'night'
          result.inIDS = scores[result.lineNumber].inIDS //indicates a FW entry that has a related IDS entry.
          delete scores[result.lineNumber]
          //readNextScore(); //TODO
        }else{
          result.anomalyScore = null;
        }
        sendLogRecord(_.extend(result, {'sensorType':name}), callback)
      })
    }
  }
  
  // function to call when there is a parse error
  function parseError(err) {
    if (err) console.error(err)
  }

  //seems kinda strange to put all this in the close event, but w/e.  
  rl.on('close', function(){
    // open a stream for the file
    var buffer = '' // buffer for a log event
    var logStream = fs.createReadStream(file)
    logStream.setEncoding('utf8')

    logStream.on('data', function (chunk) {
      buffer += chunk
      if (buffer.match(delimiter)) {
        var lines = buffer.split(delimiter)
        buffer = lines.pop() // all except last, it may be a partial line when buffer filled
        async.forEach(lines, processLine, parseError)
      }
    })

    if (watch) {
      // @see http://nodejs.org/docs/latest/api/fs.html#fs_fs_watch_filename_options_listener
      // watch the file now
      fs.watchFile(file, function(curr, prev) {
        if(prev.size < curr.size){ //if size increased, can assume it was appended to
          //don't think that we can just leave the old stream open after EOF reached, so making a new one.
          // @see https://github.com/joyent/node/issues/1862 for (abandoned) feature request
          // @see https://github.com/netroy/Lockets/blob/master/server.js for similar example to below.
          var logStreamTail = fs.createReadStream(file, { start: prev.size, end: curr.size});
          var buffer = '' // buffer for a log event
          logStreamTail.on("data", function(chunk) {
            buffer += chunk
            if (buffer.match(delimiter)) {
              var lines = buffer.split(delimiter)
              buffer = lines.pop() // all except last, it may be a partial line when buffer filled
              async.forEach(lines, processLine, parseError)
            }
          });
          logStreamTail.on('end', function () { //same as below
            processLine(buffer, parseError) 
          });
        }//TODO else there was some other change to the file, (name, permissions, etc.) may want to handle those further.
      });
    }

    logStream.on('end', function () {
      processLine(buffer, parseError) //if reached EOF, it should be a complete line (could still be empty line at end, which processLine will handle.)
    })

    logStream.on('error', function (error) {
      console.error('Error reading log file ' + file + '\n' + error)
    })
  })
}
