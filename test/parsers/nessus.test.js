/*global suite:false, test:false*/
'use strict';

var assert = require('chai').assert;
var streamTests = require('../stream-tests-common.js')

var NessusStream = require('../../parsers/nessus.js')

suite('Stream Specification Tests: nessus.js', function() {

  test('should pass stream-spec validation for through', function(){
    streamTests.throughStreamSpec( new NessusStream() )
  })

  test('should pass stream-spec validation for writable', function(){
    streamTests.writableStreamSpec( new NessusStream() )
  })

  //TODO why won't this pass?
  /*
  test('should pass stream-spec validation for readable', function(){
    streamTests.readableStreamSpec( new NessusStream() )
  })
  */
}) 

suite('Nessus Parse Tests', function(){

  var data1 = "results|127.0.0|127.0.0.1|general/tcp|19506|Security Note|Synopsis :nnInformation about the Nessus scan.nnDescription :nnThis script displays, for each tested host, information about the scan itself :nn - The version of the plugin setn - The type of plugin feed (HomeFeed or ProfessionalFeed)n - The version of the Nessus Enginen - The port scanner(s) usedn - The port range scannedn - Whether credentialed or third-party patch management    checks are possiblen - The date of the scann - The duration of the scann - The number of hosts scanned in paralleln - The number of checks done in parallelnnSolution :nnn/annRisk factor :nnNonennPlugin output :nInformation about this scan : nnNessus version : 5.0.1nPlugin feed version : 201206261238nType of plugin feed : HomeFeed (Non-commercial use only)nScanner IP : 127.0.0.1nPort scanner(s) : netstat nPort range : defaultnThorough tests : nonExperimental tests : nonParanoia level : 1nReport Verbosity : 1nSafe checks : yesnOptimize the test : yesnCredentialed checks : yesnPatch management checks : NonenCGI scanning : disablednWeb application tests : disablednMax hosts : 80nMax checks : 5nRecv timeout : 5nBackports : DetectednAllow post-scan editing: YesnScan Start Date : 2012/6/26 15:01nScan duration : 244 secnnn";

  var data2 = "results|192.168.2|192.168.2.99|general/tcp|10180|Security Note|Synopsis :nnIt was possible to identify the status of the remote host (alive or dead)nnDescription :nnThis plugin attempts to determine if the remote host is alive using one or morenping types :nn  - An ARP ping, provided the host is on the local subnetn    and Nessus is running over ethernet.nn  - An ICMP ping.nn  - A TCP ping, in which the plugin sends to the remote host n    a packet with the flag SYN, and the host will reply withn    a RST or a SYN/ACK. nn  - A UDP ping (DNS, RPC, NTP, etc).nnSolution :nnn/annRisk factor :nnNonennPlugin output :nThe remote host is considered as dead - not scanningnThe remote host did not respond to the following ping methods :n- TCP pingn- ICMP pingnnn"

  var data3 = "results|192.168.2|192.168.2.175|cifs (445/tcp)|49958|Security Hole|Synopsis :nnA library on the remote Windows host has a buffer overflownvulnerability.nnDescription :nnThe remote host has a heap buffer overflow vulnerability in thenWindows common control library.  This vulnerability can be exploitednwhen a user visits a specially crafted web page while using a third-nparty scalable vector graphics (SVG) viewer. nnA remote attacker could exploit this by tricking a user into visitingna maliciously crafted web page.nnSolution :nnMicrosoft has released a set of patches for Windows 2003, XP, Vista,n2008, 7, and 2008 R2 :nnhttp://www.microsoft.com/technet/security/bulletin/MS10-081.mspxnnRisk factor :nnHigh / CVSS Base Score : 9.3n(CVSS2#AV:N/AC:M/Au:N/C:C/I:C/A:C)nnnPlugin output :n- C:\\WINDOWS\\system32\\Comctl32.dll has not been patchedn    Remote version : 5.82.2900.5512n    Should be : 5.82.2900.6028nnnnCVE : CVE-2010-2746nBID : 43717nOther references : OSVDB:68549,EDB-ID:15963,MSFT:MS10-081n"

  var data4 = "results|192.168.2|192.168.2.175|cifs (445/tcp)|"

  test("Nessus Entry 1", function(done){
    var nessusStream = new NessusStream()
    var result = []

    nessusStream.on('data', function(data) {
      result.push(data)
    })

    nessusStream.on('end', function() {
      var obj = result[0]
      //console.log(JSON.stringify(obj))
      //assert(obj["port"] === -1)
      assert(obj.ip === "127.0.0.1")
      assert(obj.vulntype === "note" || obj.vulntype === "Security Note")
      assert(obj.vulnid === 19506)
      assert(obj.cvss === 1 || obj.cvss === 0)
      done()
    })

    nessusStream.write(data1)
    nessusStream.end()
  });

  test("Nessus Entry 2", function(done){
    var nessusStream = new NessusStream()
    var result = []

    nessusStream.on('data', function(data) {
      result.push(data)
    })

    nessusStream.on('end', function() {
      var obj = result[0]
      //console.log(JSON.stringify(obj))
      //assert(obj["port"] === -1)
      assert(obj.ip === "192.168.2.99")
      assert(obj.vulntype === "note" || obj.vulntype === "Security Note")
      assert(obj.vulnid === 10180)
      assert(obj.cvss === 1 || obj.cvss === 0)
      done()
    })

    nessusStream.write(data2)
    nessusStream.end()
  });

  test("Nessus Entry 3", function(done){
    var nessusStream = new NessusStream()
    var result = []

    nessusStream.on('data', function(data) {
      result.push(data)
    })

    nessusStream.on('end', function() {
      var obj = result[0]
      //console.log(JSON.stringify(obj))
      assert(obj.port === 445)
      assert(obj.ip === "192.168.2.175")
      assert(obj.vulntype === "hole" || obj.vulntype === "Security Hole")
      //console.log('vulnid is ' + obj.vulnid + ' and cvss is ' + obj.cvss)
      assert(obj.vulnid === 49958)
      assert(obj.cvss === 9.3)

      done()
    })

    nessusStream.write(data3)
    nessusStream.end()
  });

  test("Nessus Entry 4", function(done){

    var nessusStream = new NessusStream()
    var result = []

    nessusStream.on('data', function(data) {
      result.push(data)
    })

    nessusStream.on('end', function() {
      var obj = result[0]
      //console.log(JSON.stringify(obj))
      assert(obj.port === 445)
      assert(obj.ip === "192.168.2.175")
      assert(obj.vulntype === "")
      assert(obj.vulnid === 0)
      assert(obj.cvss === 1 || obj.cvss === 0)
      done()
    })

    nessusStream.write(data4)
    nessusStream.end()
  });

  test("Combine All Nessus Entries above", function(done){

    var nessusStream = new NessusStream()
    var result = []

    nessusStream.on('data', function(data) {
      result.push(data)
    })

    //Note: this is pretty redundant, the main thing this test is for is confirming that the buffer is properly emptied on end()
    nessusStream.on('end', function() {
      assert(result.length === 4)
      var obj = result[0]
      //console.log(JSON.stringify(obj))
      //assert(obj["port"] === -1)
      assert(obj.ip === "127.0.0.1")
      assert(obj.vulntype === "note" || obj.vulntype === "Security Note")
      assert(obj.vulnid === 19506)
      assert(obj.cvss === 1 || obj.cvss === 0)
      obj = result[1]
      //console.log(JSON.stringify(obj))
      //assert(obj["port"] === -1)
      assert(obj.ip === "192.168.2.99")
      assert(obj.vulntype === "note" || obj.vulntype === "Security Note")
      assert(obj.vulnid === 10180)
      assert(obj.cvss === 1 || obj.cvss === 0)
      obj = result[2]
      //console.log(JSON.stringify(obj))
      assert(obj.port === 445)
      assert(obj.ip === "192.168.2.175")
      assert(obj.vulntype === "hole" || obj.vulntype === "Security Hole")
      //console.log('vulnid is ' + obj.vulnid + ' and cvss is ' + obj.cvss)
      assert(obj.vulnid === 49958)
      assert(obj.cvss === 9.3)
      obj = result[3]
      //console.log(JSON.stringify(obj))
      assert(obj.port === 445)
      assert(obj.ip === "192.168.2.175")
      assert(obj.vulntype === "")
      assert(obj.vulnid === 0)
      assert(obj.cvss === 1 || obj.cvss === 0)
      done()
    })

    nessusStream.write(data1 +'\n'+ data2 +'\n'+ data3 +'\n'+ data4)
    nessusStream.end()
  });

});

