#this displays the start time for each score file.

import json
import os
from datetime import datetime
import time
import numpy as np
from matplotlib import dates

# various settings.
debug = False

inFilesDir = "../test/data/scores/"
inFiles = ['out-split.aa', 'out-split.ab', 'out-split.ac', 'out-split.ad',
           'out-split.ae', 'out-split.af', 'out-split.ag', 'out-split.ah',
           'out-split.ai', 'out-split.aj', 'out-split.ak', 'out-split.al',
           'out-split.am', 'out-split.an', 'out-split.ao', 'out-split.ap',
           'out-split.aq',  'out-split2.aa', 'out-split2.ab', 'out-split2.ac',
           'out-split2.ad', 'out-split2.ae', 'out-split2.af', 'out-split2.ag',
          ]

# the actual stuff happens here.

for fileName in inFiles:
  inFile = open(inFilesDir + fileName, 'r')
  line = inFile.readline()
  if debug:
    print line
  obj = json.loads(line.replace("'", '"'))
  currTime = dates.num2epoch( obj['time'] )
  readable = datetime.utcfromtimestamp(currTime)
  readable = datetime.ctime(readable)
  print "file " + fileName + " starts at " + str(obj['time']) + " which is " + str(currTime) + " which is " + readable + '(UTC)'

