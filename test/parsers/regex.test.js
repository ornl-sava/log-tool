/*global suite:false, test:false*/
'use strict';

var assert = require('chai').assert
  , moment = require('moment')
var streamTests = require('../stream-tests-common.js')

var RegexStream = require('../../parsers/regex.js')

suite('Stream Specification Tests: regex.js', function() {

  test('should pass stream-spec validation for through', function(){
    streamTests.throughStreamSpec( new RegexStream({"regex": ".*"}) )
  })

  test('should pass stream-spec validation for writable', function(){
    streamTests.writableStreamSpec( new RegexStream({"regex": ".*"}) )
  })

  //TODO why won't this pass?
/*
  test('should pass stream-spec validation for readable', function(){
    streamTests.readableStreamSpec( new RegexStream({"regex": ".*"}) )
  })
*/
})

suite('RegEx Parse Tests', function() {
  test('should pass simple regular expression parsing', function( done ){
    simpleRegex( done )
  })

  test('should pass timestamp expression parsing', function( done ){
    timestampRegex( done )
  })

  test('should parse firewall entries (csv format)', function( done ){
    firewallRegex( done )
  })

  test('should parse ids entries (snort format)', function( done ){
    idsRegex( done )
  })

}) 

//NB! All of these data vals end with newline.  In a real stream, this is not needed, since it is the end() method which will guarantee this instead.

var simpleRegex = function (done) {
  // define the test data
  var data = '23 45 67\n89 12 34\n56 78 90\n'

  // define the regular expression
  var parser = {
      "regex": "^([\\S]+) ([\\S]+) ([\\S]+)"
    , "labels": ["A label", "B label", "C label"]
    , "delimiter": "\r\n|\n"
  }

  var expected = [
    {"A label":"23","B label":"45","C label":"67"}
  , {"A label":"89","B label":"12","C label":"34"}
  , {"A label":"56","B label":"78","C label":"90"}
  ]

  var regexStream = new RegexStream(parser)
  var result = []

  regexStream.on('data', function(data) {
    result.push(data)
  })

  regexStream.on('end', function() {
    assert.deepEqual(result, expected)
    done()
  })

  regexStream.write(data)
  regexStream.end()

}

var timestampRegex = function (done) {
  // define the test data
  var data = '2012/07/25 10:00:00+0000: First line\n2012/07/25 14:14:14+0000: Second line\n2012/07/26 07:00:00+0000: Third line\n2012/07/26 07:07:07+0000: Fourth line\n'

  // define the regular expression
  var timeFormatter = "YYYY/MM/DD HH:MM:SS+Z"
  var parser = {
      "regex": "^([\\S\\s]+): ([\\S\\s]+)"
    , "labels": ["timestamp", "line"]
    , "fields": { "timestamp": {"regex": timeFormatter, "type": "moment"} }
  }

  var expected = [
    { timestamp: moment('2012/07/25 10:00:00+0000', timeFormatter).valueOf(), line: 'First line' }
  , { timestamp: moment('2012/07/25 14:14:14+0000', timeFormatter).valueOf(), line: 'Second line' }
  , { timestamp: moment('2012/07/26 07:00:00+0000', timeFormatter).valueOf(), line: 'Third line' }
  , { timestamp: moment('2012/07/26 07:07:07+0000', timeFormatter).valueOf(), line: 'Fourth line' }
  ]

  var regexStream = new RegexStream(parser)
  var result = []

  regexStream.on('data', function(data) {
    result.push(data)
  })

  regexStream.on('end', function() {
    assert.deepEqual(result, expected)
    done()
  })

  regexStream.write(data)
  regexStream.end()
  
}

var firewallRegex = function (done) {
  // define the test data
  var data = '05/Apr/2012 17:56:48,Info,Teardown,ASA-6-302016,UDP,172.23.0.10,193.0.14.129,(empty),(empty),64048,53,domain,outbound,0,1\n'+
    '05/Apr/2012 17:57:00,Info,Teardown,ASA-6-302016,UDP,172.23.0.10,192.203.230.10,(empty),(empty),64048,53,domain,outbound,0,1\n'+
    '05/Apr/2012 17:58:00,Info,Teardown,ASA-6-302016,UDP,172.23.0.10,192.203.230.10,(empty),(empty),64048,53,domain,outbound,0,1\n'

  // define the regular expression
  var parser = {
    "regex": "^([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*)"
    , "labels": ["timestamp", "priority", "operation", "messageCode", 
                  "protocol", "sourceIP", "destIP", "sourceHostname", "destHostname", "sourcePort", 
                  "destPort", "destService", "direction", "connectionsBuilt", "connectionsTornDown"
                ]
    , "fields": { "timestamp": {"regex": "DD/MMM/YYYY HH:mm:ss", "type": "moment"} }
    //, "timestamp": "DD/MMM/YYYY HH:mm:ss"
    , "delimiter": "\r\n|\n"
    , "startTime":0
  }

  var expected = [
      {"timestamp":1333648608000,"priority":"Info","operation":"Teardown",
        "messageCode":"ASA-6-302016","protocol":"UDP","sourceIP":"172.23.0.10",
        "destIP":"193.0.14.129","sourceHostname":"(empty)","destHostname":"(empty)",
        "sourcePort":"64048","destPort":"53","destService":"domain","direction":"outbound",
        "connectionsBuilt":"0","connectionsTornDown":"1"
      },
      {"timestamp":1333648620000,"priority":"Info","operation":"Teardown",
        "messageCode":"ASA-6-302016","protocol":"UDP","sourceIP":"172.23.0.10",
        "destIP":"192.203.230.10","sourceHostname":"(empty)","destHostname":"(empty)",
        "sourcePort":"64048","destPort":"53","destService":"domain","direction":"outbound",
        "connectionsBuilt":"0","connectionsTornDown":"1"
      },
      {"timestamp":1333648680000,"priority":"Info","operation":"Teardown",
        "messageCode":"ASA-6-302016","protocol":"UDP","sourceIP":"172.23.0.10",
        "destIP":"192.203.230.10","sourceHostname":"(empty)","destHostname":"(empty)",
        "sourcePort":"64048","destPort":"53","destService":"domain","direction":"outbound",
        "connectionsBuilt":"0","connectionsTornDown":"1"
      }
  ]

  var regexStream = new RegexStream(parser)
  var result = []

  regexStream.on('data', function(data) {
    result.push(data)
  })

  regexStream.on('end', function() {
    assert.deepEqual(result, expected)
    done()
  })

  regexStream.write(data)
  regexStream.end()
}

var idsRegex = function (done) {
  // define the test data
  var data =  '[**] [1:2100538:17] GPL NETBIOS SMB IPC$ unicode share access [**]\n'+
              '[Classification: Generic Protocol Command Decode] [Priority: 3] \n'+
              '04/05-17:55:00.933206 172.23.1.101:1101 -> 172.23.0.10:139\n'+
              'TCP TTL:128 TOS:0x0 ID:1643 IpLen:20 DgmLen:122 DF\n'+
              '***AP*** Seq: 0xCEF93F32  Ack: 0xC40C0BB  Win: 0xFC9C  TcpLen: 20\n'+
              '\n'+
              '[**] [1:2100538:17] GPL NETBIOS SMB IPC$ unicode share access [**]\n'+
              '[Classification: Generic Protocol Command Decode] [Priority: 3] \n'+
              '04/05-17:55:00.944053 172.23.1.101:1101 -> 172.23.0.10:139\n'+
              'TCP TTL:128 TOS:0x0 ID:1649 IpLen:20 DgmLen:122 DF\n'+
              '***AP*** Seq: 0xCEF942A6  Ack: 0xC40C427  Win: 0xFF13  TcpLen: 20\n'+
              '\n'+
              '[**] [1:2103000:7] GPL NETBIOS SMB Session Setup NTMLSSP unicode asn1 overflow attempt [**]\n'+
              '[Classification: Generic Protocol Command Decode] [Priority: 3] \n'+
              '04/05-17:55:00.960174 172.23.1.101:1104 -> 172.23.0.10:139\n'+
              'TCP TTL:128 TOS:0x0 ID:1663 IpLen:20 DgmLen:1500 DF\n'+
              '***A**** Seq: 0x54FEF4C7  Ack: 0x9BEB6342  Win: 0xFF36  TcpLen: 20\n'+
              '[Xref => http://www.microsoft.com/technet/security/bulletin/MS04-007.mspx][Xref => http://cgi.nessus.org/plugins/dump.php3?id=12065][Xref => http://cgi.nessus.org/plugins/dump.php3?id=12052][Xref => http://cve.mitre.org/cgi-bin/cvename.cgi?name=2003-0818][Xref => http://www.securityfocus.com/bid/9635][Xref => http://www.securityfocus.com/bid/9633]\n\n'

  // define the regular expression
  var parser = {
  "regex": "^\\[\\*\\*\\] \\[([0-9:]+)\\] ([\\S\\s]*) \\[\\*\\*\\]\\s*[\r\n|\r|\n](\\[Classification: ){0,1}([\\S\\s]*){0,1}?\\]{0,1} {0,1}\\[Priority: (\\d+)\\]\\s*[\r\n|\r|\n](\\d{2}\\/\\d{2}\\-\\d{2}:\\d{2}:\\d{2}\\.\\d{3})\\d{3} ([\\d\\.]+):{0,1}(\\d+){0,1} \\-> ([\\d\\.]+):{0,1}(\\d+){0,1}\\s*[\r\n|\r|\n]([\\s\\S]+)"
  , "labels": ["rule", "ruleText", "junkText", "classification", "priority", "timestamp", "sourceIP", "sourcePort", "destIP", "destPort", "packetInfo"]
  , "delimiter" : "\r\n\r\n|\n\n"
    , "fields": {
        "timestamp": {"regex": "MM/DD-HH:mm:ss.SSS", "type": "moment"}
      }
  //, "timestamp" : "MM/DD-HH:mm:ss.SSS"
  , "startTime":0
  }

  var expected = [
{"rule":"1:2100538:17","ruleText":"GPL NETBIOS SMB IPC$ unicode share access","junkText":"[Classification: ","classification":"Generic Protocol Command Decode] ","priority":"3","timestamp":1333648500933,"sourceIP":"172.23.1.101","sourcePort":"1101","destIP":"172.23.0.10","destPort":"139","packetInfo":"TCP TTL:128 TOS:0x0 ID:1643 IpLen:20 DgmLen:122 DF\n***AP*** Seq: 0xCEF93F32  Ack: 0xC40C0BB  Win: 0xFC9C  TcpLen: 20"},
{"rule":"1:2100538:17","ruleText":"GPL NETBIOS SMB IPC$ unicode share access","junkText":"[Classification: ","classification":"Generic Protocol Command Decode] ","priority":"3","timestamp":1333648500944,"sourceIP":"172.23.1.101","sourcePort":"1101","destIP":"172.23.0.10","destPort":"139","packetInfo":"TCP TTL:128 TOS:0x0 ID:1649 IpLen:20 DgmLen:122 DF\n***AP*** Seq: 0xCEF942A6  Ack: 0xC40C427  Win: 0xFF13  TcpLen: 20"},
{"rule":"1:2103000:7","ruleText":"GPL NETBIOS SMB Session Setup NTMLSSP unicode asn1 overflow attempt","junkText":"[Classification: ","classification":"Generic Protocol Command Decode] ","priority":"3","timestamp":1333648500960,"sourceIP":"172.23.1.101","sourcePort":"1104","destIP":"172.23.0.10","destPort":"139","packetInfo":"TCP TTL:128 TOS:0x0 ID:1663 IpLen:20 DgmLen:1500 DF\n***A**** Seq: 0x54FEF4C7  Ack: 0x9BEB6342  Win: 0xFF36  TcpLen: 20\n[Xref => http://www.microsoft.com/technet/security/bulletin/MS04-007.mspx][Xref => http://cgi.nessus.org/plugins/dump.php3?id=12065][Xref => http://cgi.nessus.org/plugins/dump.php3?id=12052][Xref => http://cve.mitre.org/cgi-bin/cvename.cgi?name=2003-0818][Xref => http://www.securityfocus.com/bid/9635][Xref => http://www.securityfocus.com/bid/9633]"}
  ]

  var regexStream = new RegexStream(parser)
  var result = []

  regexStream.on('data', function(data) {
    result.push(data)
  })

  regexStream.on('end', function() {
    assert.deepEqual(result, expected)
    done()
  })

  regexStream.write(data)
  regexStream.end()
}
