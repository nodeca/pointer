/*global describe, it*/


'use strict';


var assert  = require('assert');
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
      '/foo/{id}': { prefix: '//example.com' }
    });


    it('should respect prefix', function () {
      var match = pointer.match('//example.com/foo/42');
      assert.deepEqual(match && match.params, { id: '42' });
    });


    // issue#2: https://github.com/nodeca/pointer/issues/2
    describe('with similar routes', function () {
      var pointer = new Pointer({
        '/tests(/{a}(/{b}(/{c}(/{d}))))': { meta: 'uno' },
        '/tests/{a}/{b}/{c}/fun(/{d})':   { meta: 'dos' }
      });


      it('should find correct route', function () {
        var match;

        match = pointer.match('/tests/pluto');
        assert.equal(match && match.meta, 'uno');

        match = pointer.match('/tests/1/2/3/fun');
        assert.equal(match && match.meta, 'dos');
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
