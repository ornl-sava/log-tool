#!/bin/bash
# Script must be run from the project root directory (not the scripts directory)

PATH=/usr/local/bin:/usr/local/sbin:$PATH
export PATH

# Start application as daemon using [forever](https://github.com/nodejitsu/forever)
# switch node environment for express and socket.io settings (development or production)
./node_modules/forever/bin/forever start logtool.js
