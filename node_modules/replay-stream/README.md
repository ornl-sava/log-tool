[![Build Status](https://travis-ci.org/ornl-situ/replay-stream.png?branch=master)](https://travis-ci.org/ornl-situ/replay-stream)


# filter/emit/shift JSON objects based on their timestamp

This module will take in a [stream](http://nodejs.org/docs/latest/api/stream.html) of JSON strings, read their specified timestamp field, and output according to the given criteria.  This can include restricting output to a certain time range, and/or outputting the items with some delay based on their timestamp.

This was created to help when replaying log events or similar recorded events, for use with the [log-tool](https://github.com/ornl-situ/log-tool) and [replay-stream](https://github.com/ornl-situ/replay-stream) projects.


## Install

npm install replay-stream


## Configuration and Usage

The following is an example of available options:

    opts = {
      "relativeTime" : false ,
      "startTime" : 0 ,
      "endTime" : moment('2013/01/01 07:07:07+0000', timeFormatter).valueOf() ,
      "timestampName" : "timestamp", 
      "timestampType" : "moment" ,
      "timestampFormat" : "YYYY-MM-DD HH-MM-SS-Z" ,
      "stringifyOutput" : true
    }

The options are defined as:

 *  `replayConfig.relativeTime`: if true, will output the results in 'relative time', meaning with a delay of the entry's timestamp minus the startTime argument below.
 *  `replayConfig.startTime`: will ignore entries before this time.  specified in seconds, unix-style
 *  `replayConfig.endTime`: will ignore entries after this time.  specified in seconds, unix-style
 *  `replayConfig.timestampName`: the name of the field that contains the timestamp.  Default is "timestamp"
 *  `replayConfig.timestampType`: the type of timestamp, currently only "moment" is defined.
 *  `replayConfig.timestampFormat`: the format of the timesatmp, if needed.  eg. "YYYY-MM-DD HH-MM-SS-Z"
 *  `replayConfig.stringifyOutput`: will make sure that output is stringified if needed.


## Development

If you are going to do development, you may want to use the [git pre-commit hook](http://git-scm.com/book/en/Customizing-Git-Git-Hooks), which will check the `replay-stream.js` file using [jshint](https://github.com/jshint/jshint) script (if you have it installed) and run the [mocha](visionmedia.github.com/mocha/) tests (mocha is in the git repo). If either of these fail, the commit wont work. To use the hook, from project directory, run:

    ln -s ../../scripts/pre-commit.sh .git/hooks/pre-commit


## Documentation

To build the documentation and prepare the github project pages site, run:

    npm run-script docs
    

# License

replay-stream is freely distributable under the terms of the MIT License.

Copyright (c) Mike Iannacone (the "Original Author")

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS, THE U.S. GOVERNMENT, OR UT-BATTELLE BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
