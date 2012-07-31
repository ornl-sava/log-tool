var tako = require("tako")
  , zlib = require("zlib")
  , Negotiator = require('negotiator')
  ;

module.exports = function(req, res) {
  var negotiator = new Negotiator(req);

  if (negotiator.preferredEncodings().indexOf('gzip') !== -1) {
    var gzip = zlib.Gzip()
      , _write = res._write
      , _end = res._end
      , hasData = false
      ;

    gzip.on('data', function(data) {
      _write.call(res, data);
    });

    gzip.on('end', function() {
      _end.call(res);
    });

    res._write = function(data) {
      hasData = true;
      gzip.write(data);
      if (res._header) return; // Don't write when header is finished
      res.setHeader('content-encoding', 'gzip');
      res.removeHeader('content-length');
    }

    res._end = function() {
      if (!hasData) {
        return _end.call(res);
      }
      gzip.end();
    }
  }
}
