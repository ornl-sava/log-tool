# Tests

From project root dir, all tests can be run with: mocha -u tdd -R spec
Individual module tests can be run with, for example: mocha -u tdd -R spec ./test/input/file.test.js 

Tests for core application and its various utilities (things in . and ./lib) go here

Tests for included modules go in appropriate subdirectories in here (eg tests for ./parsers go in ./tests/parsers)

###Tests for non-core modules
Tests for other modules go in their own test dir (eg tests for files in some_module and some_module/bin should go in some_module/test)
Note: this is only required so that the modules' tests can be invoked by logtool's tests.

Any needed data for these tests is in ./test/data, any other modules can include their test data where needed (some_module/test/data, or other location)
