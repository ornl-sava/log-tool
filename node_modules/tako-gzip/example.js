var tako = require('tako')
  , app = tako()
  , gzip = require('./gzip')
  ;

app.on('request', gzip);

app.route('/').json({
  "hello": "gzip"
});

app.route('/foo').text('This text is gzipped');

app.route('/bar')
  .html(function (req, res) {
    res.end('<html><body>Hello, world</body></html>');
  })
  .methods('GET');

app.httpServer.listen(8080);
