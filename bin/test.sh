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
echo ''

echo 'running console input/output tests ...'

echo 'this is a test' > in.txt
echo 'i am testing some things' >> in.txt
echo 'some text in a file' >> in.txt
echo 'very exciting stuff' >> in.txt
echo 'blah blah blah blah blah blah' >> in.txt
echo 'stuff stuff stuff stuff' >> in.txt
echo 'best test ever' >> in.txt

echo '' > out.txt
cat in.txt | node ./test/stdinTest.js
diff in.txt out.txt

echo '' > out.txt
node ./test/stdoutTest.js > out.txt
diff in.txt out.txt

touch temp.in.txt
rm temp.in.txt
touch temp.in.txt
node ./test/watchfileTest.js &
sleep 1
cat in.txt > temp.in.txt
sleep 1
diff in.txt out.txt

a=`cat ./test/data/firewall-vast12-1m.csv | wc -l`
node logSlicer.js -i ./test/data/firewall-vast12-1m.csv -o ./out.txt -p firewall -s 1333732850
b=`cat out.txt | wc -l`
node logSlicer.js -i ./test/data/firewall-vast12-1m.csv -o ./out.txt -p firewall -e 1333732851
c=`cat out.txt | wc -l`
if [ $a -eq 0 ]
  then
    echo "logSlicer test failed!"
fi
if [ $a -ne $((b+c)) ]
  then
    echo "logSlicer test failed!"
fi

rm out.txt
touch out.txt
node logEmitter.js -i ./test/data/firewall-vast12-1m.csv -o ./out.txt -p firewall -s 1333732850 -e 1333732852 &
d=`cat out.txt | wc -l`
#echo $d
if [ $d -ne 0 ]
  then
    echo "logEmitter test failed! (emitted too much / too fast)"
fi
sleep 2
e=`cat out.txt | wc -l`
#echo $e
if [ $e -ne 10 ]
  then
    echo "logEmitter test failed! (emitted too little / too slow)"
fi

echo 'done!'
echo ''

echo 'running mocha tests ...'
mocha -u tdd -R spec -t 10000 ./test/mocha-tests.js

rm ./out.txt
rm ./in.txt
rm ./temp.in.txt
