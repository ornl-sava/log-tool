#!/bin/bash
# Script must be run from the project root directory (not the scripts directory)

PATH=/usr/local/bin:/usr/local/sbin:$PATH
export PATH

# Shutdown application
forever="./node_modules/forever/bin/forever"
$forever stop logtool.js
