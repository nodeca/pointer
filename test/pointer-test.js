/*global describe, it*/


'use strict';


var assert  = require('assert');
var url     = require('url');
var Pointer = require('..');


////////////////////////////////////////////////////////////////////////////////


describe('Pointer', function () {

  describe('constructor', function () {

    it('should accept Object', function () {
      var pointer = new Pointer({
        123: { name: 'foo' },
        456: {}
      });

      assert.deepEqual(pointer.config, [
        { name: 'foo', pattern: '123' },
        { pattern: '456' }
      ]);
    });

    it('should accept Array', function () {
      var pointer = new Pointer([
        { name: 'foo', pattern: '123' },
        { pattern: '456' }
      ]);

      assert.deepEqual(pointer.config, [
        { name: 'foo', pattern: '123' },
        { pattern: '456' }
      ]);
    });

    it('should allow skip "new"', function () {
      /*eslint-disable new-cap*/
      var pointer = Pointer([
        { name: 'foo', pattern: '123' }
      ]);

      assert.deepEqual(pointer.config, [
        { name: 'foo', pattern: '123' }
      ]);
    });


  });


  describe('#linkTo', function () {
    var pointer = new Pointer({
      '/foo/{id}/index.html': { name: 'foo', params: { id: /\d+?/ } },
      '/bar/index.html':      { name: 'bar' },
      '/baz(/{id})':          { name: 'baz', params: { id: /\d+?/ } },
      '/quux(/one{p1})':      { name: 'quux', params: { p1: /\d+?/ } },
      '/quux(/two{p2})':      { name: 'quux', params: { p2: /\d+?/ } },
      '/quux/three{p3}':      { name: 'quux', params: { p2: /\d+?/ } }
    });


    it('should respect name', function () {
      assert.deepEqual(pointer.linkTo('foo', {}), null);
      assert.deepEqual(pointer.linkTo('foo', { id: 42 }), '/foo/42/index.html');
    });

    it('should works without params', function () {
      assert.deepEqual(pointer.linkTo('baz'), '/baz');
      assert.deepEqual(pointer.linkTo('baz', { id: 17 }), '/baz/17');
    });

    it('should support multiple routes with the same name', function () {
      assert.deepEqual(pointer.linkTo('quux'), '/quux');
      assert.deepEqual(pointer.linkTo('quux', { p1: 1 }), '/quux/one1');
      assert.deepEqual(pointer.linkTo('quux', { p2: 2 }), '/quux/two2');
      assert.deepEqual(pointer.linkTo('quux', { p3: 3 }), '/quux/three3');
    });

    it('should pick longest url if multiple choices are available', function () {
      assert.deepEqual(pointer.linkTo('quux', { p1: 1337, p2: 2 }), '/quux/one1337');
      assert.deepEqual(pointer.linkTo('quux', { p1: 1, p2: 1337 }), '/quux/two1337');
    });
  });


  describe('#match', function () {
    var pointer = new Pointer({
      '/':         { prefix: '//example.com', meta: 'root' },
      '/foo/{id}': { prefix: '//example.com' }
    });


    it('should respect prefix', function () {
      var match = pointer.match('//example.com/foo/42');
      assert.deepEqual(match && match.params, { id: '42' });
    });


    it('should match root without trailing slash', function () {
      var match = pointer.match('//example.com');
      assert.deepEqual(match && match.meta, 'root');
    });


    it('should match root with trailing slash', function () {
      var match = pointer.match('//example.com/');
      assert.deepEqual(match && match.meta, 'root');
    });


    it('should alias "" to "/" if there is no path in prefix', function () {
      var p, match;

      p = new Pointer({
        '': { prefix: '//example.com', meta: 'test' }
      });

      match = p.match('//example.com');
      assert.deepEqual(match && match.meta, 'test');
      match = p.match('//example.com/');
      assert.deepEqual(match && match.meta, 'test');
    });


    it('should not alias "" to "/" if there is a path in prefix', function () {
      var p, match;

      p = new Pointer({
        '': { prefix: '//example.com/foo', meta: 'test' }
      });

      match = p.match('//example.com/foo');
      assert.deepEqual(match && match.meta, 'test');
      match = p.match('//example.com/foo/');
      assert.deepEqual(match, null);
    });


    // issue#2: https://github.com/nodeca/pointer/issues/2
    describe('with similar routes', function () {
      var p = new Pointer({
        '/tests(/{a}(/{b}(/{c}(/{d}))))': { meta: 'uno' },
        '/tests/{a}/{b}/{c}/fun(/{d})':   { meta: 'dos' }
      });


      it('should find correct route', function () {
        var match;

        match = p.match('/tests/pluto');
        assert.equal(match && match.meta, 'uno');

        match = p.match('/tests/1/2/3/fun');
        assert.equal(match && match.meta, 'dos');
      });
    });


    describe('with custom url parser', function () {
      function url_parse(u) { return url.parse(u, false, true); }

      it('should accept custom parser', function () {
        var p = new Pointer({
          '/foo/{id}': {}
        }, url_parse);

        var match = p.match('http://example.com/foo/42');
        assert.deepEqual(match && match.params, { id: '42' });
      });


      it('should work with prefix', function () {
        var p = new Pointer({
          '/':         { prefix: 'http://example.com', meta: 'root' },
          '/foo/{id}': { prefix: 'http://example.com', meta: 'foo' }
        }, url_parse);
        var match;

        match = p.match('http://example.com/');
        assert.deepEqual(match && match.meta, 'root');

        match = p.match('http://example.com/foo/42');
        assert.deepEqual(match && match.meta, 'foo');
      });
    });
  });


  describe('#matchAll', function () {
    var pointer = new Pointer({
      '/({word})':    { meta: 1 },
      '/':            { meta: 2 },
      '/hello/world': { meta: 3 }
    });


    it('should return an empty array if no routes are matched', function () {
      var match = pointer.matchAll('/non/existent');

      assert.strictEqual(Object.prototype.toString.call(match), '[object Array]');
      assert.strictEqual(match.length, 0);
    });


    it('should match all suitable routes', function () {
      var match = pointer.matchAll('/');

      assert.strictEqual(Object.prototype.toString.call(match), '[object Array]');
      assert.strictEqual(match.length, 2);
      assert(match.every(function (data) { return data.meta === 1 || data.meta === 2; }));
    });
  });
});
