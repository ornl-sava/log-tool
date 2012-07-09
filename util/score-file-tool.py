#this reads in a list of scores files, and outputs a slice of the scores defined by the criteria below.

import json
import os

# various settings.
debug = False

keepIDS = True
keepFW = True

fwStartLine = 0
fwEndLine = 1000000000
idsStartLine = 0
idsEndLine = 1000000000

#timestamps in epoch time (ms)
startTime = 1333664716000
endTime   = 1333664718000

inFilesDir = "../test/data/scores/"
inFiles = ['out-split.aa', 'out-split.ab', 'out-split.ac', 'out-split.ad',
           'out-split.ae', 'out-split.af', 'out-split.ag', 'out-split.ah',
           'out-split.ai', 'out-split.aj', 'out-split.ak', 'out-split.al',
           'out-split.am', 'out-split.an', 'out-split.ao', 'out-split.ap',
           'out-split.aq',  'out-split2.ar', 'out-split2.as', 'out-split2.at',
           'out-split2.au', 'out-split2.av', 'out-split2.aw', 'out-split2.ax',]

# the actual stuff happens here.

outFileName = "./scores.out.json"
try:
  os.remove(outFileName) #remove the old one.
except OSError as e:
   print 'Note: could not delete old output file.  (There probably was none)'
outFile = open(outFileName, 'w')

for fileName in inFiles:
  inFile = open(inFilesDir + fileName, 'r')
  line = inFile.readline()
  while line != '':
    #if debug:
    #  print line
    obj = json.loads(line.replace("'", '"'))
    currTime = ( (obj['time'] - 719163.0)*24*60*60 + 4*60*60 ) * 1000 #converts to epoch time.
    if currTime > startTime and currTime < endTime:
      if (obj['id'][0:2] == 'fw' and keepFW):
        if int(obj['id'][3:]) > fwStartLine and int(obj['id'][3:]) < fwEndLine: #TODO str/int conversion?
          outFile.write(line)
        elif debug :
          print "line " + obj['id'][4:] + " outside target range"
      elif (obj['id'][0:3] == 'ids' and keepIDS):
        if int(obj['id'][4:]) > idsStartLine and int(obj['id'][4:]) < idsEndLine: #TODO str/int conversion?
          outFile.write(line)
        elif debug :
          print "line " + str(obj['id'][4:]) + " outside target range"
      else :
        print "unknown ID: " + obj['id']
    elif debug :
      print "time " + str(currTime) + " outside target time range"
    line = inFile.readline()

