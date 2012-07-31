# tako-gzip

A simple gzip middleware for Tako.

Uses [negotiator](http://search.npmjs.org/#/negotiator) to only gzip when the http request `Accept-Encoding` include gzip.

## Installation

<pre>
  npm install tako tako-gzip
</pre>

## Usage

```javascript
var gzip = require("tako-gzip");

// gzip responses when possible
app.on('request', gzip);

// response is now gzipped.
app.route('/').json({
  "hello": "gzip"
});
```

