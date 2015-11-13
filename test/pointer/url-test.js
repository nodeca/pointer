/*global describe, it*/


'use strict';


var assert = require('assert');
var url    = require('../../lib/pointer/url');


describe('Pointer.URL', function () {
  it('must not throw when input string contains invalid UTF-8 codes', function () {
    // U+00AF (MACRON) must be encoded as %C2%AF in UTF-8.
    // So this is a malformed URI and internal decodeURI will throw on it.
    assert.doesNotThrow(function () { url('http://example.com/%AF'); }, URIError);
  });

  it('must not throw on incorrect querystring', function () {
    assert.doesNotThrow(function () { url('http://example.com/?[]&test=1'); });
  });
});
