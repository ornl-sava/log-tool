#this displays the start time for each score file.

import json
import os
from datetime import datetime
import time

# various settings.
debug = False

inFilesDir = "../test/data/scores/"
inFiles = ['out-split.aa', 'out-split.ab', 'out-split.ac', 'out-split.ad',
           'out-split.ae', 'out-split.af', 'out-split.ag', 'out-split.ah',
           'out-split.ai', 'out-split.aj', 'out-split.ak', 'out-split.al',
           'out-split.am', 'out-split.an', 'out-split.ao', 'out-split.ap',
           'out-split.aq',  'out-split2.ar', 'out-split2.as', 'out-split2.at',
           'out-split2.au', 'out-split2.av', 'out-split2.aw', 'out-split2.ax',]

# the actual stuff happens here.

for fileName in inFiles:
  inFile = open(inFilesDir + fileName, 'r')
  line = inFile.readline()
  if debug:
    print line
  obj = json.loads(line.replace("'", '"'))
  currTime = ( (obj['time'] - 719163.0)*24*60*60 + 4*60*60 ) #converts to epoch time.
  readable = datetime.utcfromtimestamp(currTime)
  readable = datetime.ctime(readable)
  print "file " + fileName + " starts at " + str(obj['time']) + " which is " + str(currTime) + " which is " + readable + '(UTC)'

