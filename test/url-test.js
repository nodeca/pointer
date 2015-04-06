/*global describe, it*/


'use strict';


var assert = require('assert');
var url    = require('../lib/pointer/url');


////////////////////////////////////////////////////////////////////////////////


describe('Pointer.URL', function () {
  it('should allow omit protocol', function () {
    var parsed = url('//example.com/index.html');

    assert.equal('/index.html', parsed.attr('path'));
    assert.equal('example.com', parsed.attr('host'));
    assert.equal('',            parsed.attr('protocol'));
  });


  it('should allow omit host part', function () {
    var parsed = url('/index.html');

    assert.equal('/index.html', parsed.attr('path'));
    assert.equal('',            parsed.attr('host'));
    assert.equal('',            parsed.attr('protocol'));
  });


  it('should remove auth part from host', function () {
    var parsed = url('http://ixti:1234@example.com/');

    assert.equal('ixti',        parsed.attr('user'));
    assert.equal('1234',        parsed.attr('password'));
    assert.equal('example.com', parsed.attr('host'));
  });


  // excessive test to make sure we have all parts correctly extracted
  // TODO: Replace with normal tests, testing edge cases?
  it('should correctly parse all URI parts', function () {
    var parsed = url('http://user:pass@example.com/path.html?key=val#anchor');

    assert.equal('http',        parsed.attr('protocol'));
    assert.equal('user',        parsed.attr('user'));
    assert.equal('pass',        parsed.attr('password'));
    assert.equal('example.com', parsed.attr('host'));
    assert.equal('/path.html',  parsed.attr('path'));
    assert.equal('key=val',     parsed.attr('query'));
    assert.equal('anchor',      parsed.attr('fragment'));
  });
});
