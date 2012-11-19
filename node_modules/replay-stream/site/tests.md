---
layout: default
title: replay-stream tests
---

PAUSE STREAM PAUSING
PAUSE STREAM RESUMING
# TOC
   - [Stream Specification Tests](#stream-specification-tests)
     - [# writable stream-spec](#stream-specification-tests--writable-stream-spec)
     - [# readable stream-spec](#stream-specification-tests--readable-stream-spec)
     - [# through stream-spec](#stream-specification-tests--through-stream-spec)
   - [replay stream Tests](#replay-stream-tests)
     - [# simple stream test](#replay-stream-tests--simple-stream-test)
     - [# simple timestamp test](#replay-stream-tests--simple-timestamp-test)
<a name="" />
 
<a name="stream-specification-tests" />
# Stream Specification Tests
<a name="stream-specification-tests--writable-stream-spec" />
## # writable stream-spec
should pass stream-spec validation for writable.

```js
writableStreamSpec(new ReplayStream())
```

<a name="stream-specification-tests--readable-stream-spec" />
## # readable stream-spec
should pass stream-spec validation for readable.

```js
readableStreamSpec(new ReplayStream())
```

<a name="stream-specification-tests--through-stream-spec" />
## # through stream-spec
should pass stream-spec validation for through.

```js
readableStreamSpec(new ReplayStream())
```

<a name="replay-stream-tests" />
# replay stream Tests
<a name="replay-stream-tests--simple-stream-test" />
## # simple stream test
should pass pause-unpause stream tests.

```js
pauseUnpauseStream()
```

<a name="replay-stream-tests--simple-timestamp-test" />
## # simple timestamp test
should pass simple timestamp reading.

```js
simpleReplay(done)
```

<a name="replay-stream-tests--simple-timestamp-test" />
## # simple timestamp test
should pass simple timestamp reading.

```js
simpleReplayWithConversion(done)
```

