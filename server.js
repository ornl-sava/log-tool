/*jslint  node: true, white: true */
/*jshint  node: true, indent: 2, globalstrict: true */

/* 
    read from a log file, convert to JSON, and emit new records
*/

'use strict'

/*  
    Import filesystem core module
    @see http://nodejs.org/docs/latest/api/fs.html
    @requires
*/
var fs = require('fs')

/*  
    Import path core module
    @see http://nodejs.org/docs/latest/api/path.html
    @requires
*/
var path = require('path')

/*  
    Import csv module
    @see http://www.adaltas.com/projects/node-csv/
    @requires
*/
var csv = require('csv')

/*  
    Import async module
    @see https://github.com/caolan/async
    @requires
*/
//var async = require('async')

/*  
    Import underscore module
    @see http://documentcloud.github.com/underscore/
    @requires
*/
//var _ = require('underscore')

/*  
    Import [redis](http://redis.io/) module
    @see https://github.com/mranney/node_redis
    @requires
*/
//var redis = require('redis'),
//    rc = redis.createClient(); // create redis connection



/*
TODO
 * read configuration from file (use node envy)

*/


var inFile = 'test/data/firewall-vast12.csv',
    outFile = 'test/data/firewall-vast12.json',
    writeStream = fs.createWriteStream(outFile)
    
writeStream.on('error', function (err) { console.log(err) })
writeStream.on('close', function () { console.log('completed') })

writeStream.write('[')

csv()
  .fromPath(inFile, {trim: true, columns: true})
/*  
  .transform(function(data){
      data.su-timestamp = Date.now()
      return data
  })
*/
  .on('data',function(data,index){
    writeStream.write(JSON.stringify(data))
  })
  .on('end',function(count){
    console.log('Number of lines: '+count)
    writeStream.write(']')
    writeStream.end()
  })
  .on('error',function(err){
    console.log(err.message)
  })
