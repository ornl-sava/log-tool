[![Build Status](https://travis-ci.org/ornl-situ/redis-row-stream.png?branch=master)](https://travis-ci.org/ornl-situ/redis-row-stream)


# Send a stream of items to Redis

This module will take in objects or strings as a [stream](http://nodejs.org/docs/latest/api/stream.html), and send it to redis for storage, with a key of some specified prefix, followed by some index, such as "prefix:0".

## Install

npm install redis-row-stream

## Configuration

The RedisPubsubStream constructor should be passed an opts object as its argument, similar to the following:

    var opts = { keyPrefix:"simpleRowTest"
        , index:false
        , indexedFields:[]
        , serverAddress: "localhost" 
        , serverPort:6379 
        , redisOpts: {} }

`keyPrefix` is the prefix to use for all keys.  It will be followed by some index, as mentioned above, so in this case keys would be "simpleRowTest:0", "simpleRowTest:1", etc.

`index` is a boolean flag that indicates if any fields should be indexed (using [reds](https://github.com/visionmedia/reds) currently).  If set true, then the fields listed in `indexedFields` will be indexed in this way.  (Note that adding fields to the index will somewhat slow performance.)

`serverAddress` is the address of Redis server, and `port` is the port on which the Redis server is listening.

The `redisOpts` field contains any options to pass to the Redis constructor, which are listed in the [documentation for the node_redis module](https://github.com/mranney/node_redis#rediscreateclientport-host-options)

## Usage

For each incoming message, this module will output a corresponding pubsub message, on the specified channel, sent to the specified Redis instance.

This example (based on one of the test cases) reads in a json file with an array of items, parses them, and sends each items to the pubsub stream. 

    var RedisRowStream = require('../redis-row-stream.js')
      , fs = require('fs')
      , path = require('path')

    var inFile = path.join('test', 'input', 'simpleData.json')
      , opts = { keyPrefix:"simpleRowTest"
        , index:false
        , indexedFields:[]
        , serverAddress: "localhost" 
        , serverPort:6379 
        , redisOpts: {} }

    var testStream = new RedisRowStream(opts)

    fs.readFile(inFile, function (err, data) {
      if (err) throw err
      data = JSON.parse(data)
      for(var i=0; i<data.length; i++){
        testStream.write(data[i]);
      }
    })

Rather than sending items with .write(), a more typical example may simply pipe several streams together, for example:

    var util = require('util')
      , RedisRowStream = require('regex-stream')

    var input = require('fs').createReadStream('./data.txt', {encoding:'utf-8'})
      , parser = {
          "regex": "^([\\S]+) ([\\S]+) ([\\S]+)"
        , "labels": ["A label", "B label", "C label"]
        , "delimiter": "\r\n|\n"
      }
      , regexStream = new RegexStream(parser)

    var opts = { keyPrefix:"simpleRowTest"
        , index:false
        , indexedFields:[]
        , serverAddress: "localhost" 
        , serverPort:6379 
        , redisOpts: {} }

    var testStream = new RedisRowStream(opts)

    // pipe data from input file to the regexStream parser to redis pubsub
    input.pipe(regexStream)
    regexStream.pipe(testStream)

This example will create a file stream, use the [regexStream](https://github.com/ornl-situ/regex-stream) instance to parse its items, and then pipe that output into the RedisPubsubStream instance.

See the test cases for some usage examples.

## Development

If you are going to do development, you may want to use the [git pre-commit hook](http://git-scm.com/book/en/Customizing-Git-Git-Hooks), which will check the `redis-row-stream.js` file using [jshint](https://github.com/jshint/jshint) script (if you have it installed) and run the [mocha](visionmedia.github.com/mocha/) tests (mocha is in the node_modules directory). If either of these fail, the commit wont work. To use the hook, from project directory, run:

    ln -s ../../pre-commit.sh .git/hooks/pre-commit

# License

regex-stream is freely distributable under the terms of the MIT License.

Copyright (c) John R. Goodall (the "Original Author")

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS, THE U.S. GOVERNMENT, OR UT-BATTELLE BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
