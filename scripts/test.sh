#!/bin/bash
# Script must be run from the project root directory (not the scripts directory)

PATH=/usr/local/bin:/usr/local/sbin:$PATH
export PATH

echo 'running jshint on everything ...'
jshint *.js
jshint ./lib/*.js
jshint ./input/*.js
jshint ./output/*.js
jshint ./parsers/*.js
jshint ./test/*.js
jshint ./test/input/*.js
jshint ./test/output/*.js
jshint ./test/parsers/*.js
echo 'done with jshint!'

mocha -u tdd -R spec -t 10000
