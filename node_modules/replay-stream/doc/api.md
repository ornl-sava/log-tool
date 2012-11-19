

<!-- Start replay-stream.js -->

shint node:true, indent:2, globalstrict: true, asi: true, laxcomma: true, laxbreak: true

lobal module:true, require:true, console:true, process:true

This module will transform a string into stringified JSON object
It will input a stream, parse it according to a regular expression and output to a stream.

# Example:
   var ReplayStream = require('replay-stream')
   var replayStream = new ReplayStream(parserConfig)
   util.pump(inputStream, replayStream)
   util.pump(replayStream, outputStream)

## ReplayStream(replayConfig)

Constructor is a single global object

### Params: 

* **Object** *replayConfig* The regular expression configuration. Available options: 

## write(data)

Parse a chunk and emit the parsed data

### Params: 

* **String** *data* to write to stream (assumes UTF-8)

## end(data)

Write optional parameter and terminate the stream, allowing queued write data to be sent before closing the stream.

### Params: 

* **String** *data* The data to write to stream (assumes UTF-8)

## pause()

Pause the stream

## resume()

Resume stream after a pause, emitting a drain

## destroy()

Destroy the stream. Stream is no longer writable nor readable.

## parseMoment(string, formatter)

Uses [Moment.js](http://momentjs.com/) to parse a string into a timestamp
If data cannot be properly parsed, an error is emitted

### Params: 

* **String** *string* The string to parse

* **String** *formatter* The formatter to use to parse

### Return:

* **Number** timestamp The number of *milliseconds* since the Unix Epoch

## getTimestamp(item)

Will return the timestamp of this item, converted to epoc time (seconds)

### Params: 

* **String** *item* The item to read this timestamp from

## formatOutput(item)

Uses [Moment.js](http://momentjs.com/) to parse a string into a timestamp
If data cannot be properly parsed, an error is emitted

### Params: 

* **String** *item* The item to (re)format before output

<!-- End replay-stream.js -->

