/*global describe, it*/


'use strict';


var assert   = require('assert');
var Route    = require('../../lib/pointer/route');
var parseURL = require('../../lib/pointer').parseURL;


////////////////////////////////////////////////////////////////////////////////


// simple macros to test resulting `.params` of route.match if any
function testMatch(route, url, expectedParams) {
  var match = route.match(url);
  assert.deepEqual(match && match.params, expectedParams);
}


////////////////////////////////////////////////////////////////////////////////


describe('Pointer.Route', function () {
  describe('#match', function () {
    it('should match with boundaries', function () {
      var route = new Route('/articles');

      testMatch(route, '/articles/', null);
      testMatch(route, '/articles',  {});
    });


    it('should require params', function () {
      var route = new Route('/article/{id}');

      testMatch(route, '/article/',     null);
      testMatch(route, '/article/abc',  { id: 'abc' });
      testMatch(route, '/article/123',  { id: '123' });
    });


    it('should allow omit optional groups', function () {
      var route = new Route('/{id}(-{slug})');

      testMatch(route, '/42',     { id: '42', slug: void 0 });
      testMatch(route, '/42-bar', { id: '42', slug: 'bar' });
    });


    it('should match param patterns', function () {
      var route = new Route('/foo/{id}.html', {
        id: { match: /[0-9]{2}/ }
      });

      testMatch(route, '/foo/42.html',   { id: '42' });
      testMatch(route, '/foo/123.html',  null);
    });

    it('should coerce integers', function () {
      var route = new Route('/foo/{id}.html', {
        id: { type: 'integer' }
      });

      assert.strictEqual(route.match('/foo/42.html').params.id, 42);
    });

    describe('when param is given as RegExp', function () {
      it('should be a shorthand to `match` option', function () {
        var route = new Route('/foo/{id}.html', { id: /[0-9]{2}/ });

        testMatch(route, '/foo/42.html',   { id: '42' });
        testMatch(route, '/foo/123.html',  null);
      });
    });


    it('allows specify default value of params', function () {
      var route = new Route('/foo/{id}(.{format})', {
        format: { 'default': 'html' }
      });

      testMatch(route, '/foo/42',       { id: '42', format: 'html' });
      testMatch(route, '/foo/42.json',  { id: '42', format: 'json' });
    });


    describe('when param is given as non-Object and not RegExp', function () {
      it('should be a shorthand to `default` option', function () {
        var route = new Route('/foo/{id}(.{format})', { format: 'html' });

        testMatch(route, '/foo/42',       { id: '42', format: 'html' });
        testMatch(route, '/foo/42.json',  { id: '42', format: 'json' });
      });
    });


    it('should return default value of params not in the pattern', function () {
      var route = new Route('/question.html', { answer: 42 });

      testMatch(route, '/question.html', { answer: 42 });
    });


    it('should escape RegExp metachars', function () {
      var route = new Route('/foo[bar]*?/baz.{format}');

      testMatch(route, '/foo[bar]*?/baz.html', { format: 'html' });
    });


    it('should throw Error on duplicate param name', function () {
      assert.throws(function () {
        return new Route('/f{id}/t{id}');
      }, Error);
    });
  });


  describe('#buildURL', function () {
    it('should fail if required param is missing', function () {
      var route = new Route('/foobar/{id}');
      assert.deepEqual(route.buildURL({}), null);
    });


    it('should skip missing optional groups', function () {
      var route = new Route('/foobar/{id}(-{slug}(.{ext}))');

      assert.deepEqual(route.buildURL({
        id: 42
      }), '/foobar/42');

      assert.deepEqual(route.buildURL({
        id:   42,
        slug: 'the-answer'
      }), '/foobar/42-the-answer');

      assert.deepEqual(route.buildURL({
        id:   42,
        slug: 'the-answer',
        ext:  'html'
      }), '/foobar/42-the-answer.html');
    });


    // FIXME: Bug or feature???
    it('should not respect params matcher', function () {
      var route = new Route('/foo/{id}', { id: /\d+/ });
      assert.deepEqual(route.buildURL({ id: 'bar' }), '/foo/bar');
    });


    it('should preserve prefix', function () {
      var route = new Route('/foobar/{id}', {}, {}, '//example.com', parseURL);
      assert.deepEqual(route.buildURL({ id: 42 }), '//example.com/foobar/42');
    });

    it('should fill-in missed prefix parts if linkDefaults are provided', function () {
      var route1 = new Route('/route', {}, {}, '//example.com/foo', parseURL),
          route2 = new Route('/route', {}, {}, ''),
          linkDefaults = {
            protocol: 'https',
            hostname: 'github.com',
            port:     8080
          };

      assert.strictEqual(route1.buildURL(),
                         '//example.com/foo/route');

      assert.strictEqual(route1.buildURL(null, linkDefaults),
                         'https://example.com:8080/foo/route');

      assert.strictEqual(route2.buildURL(null, linkDefaults),
                         'https://github.com:8080/route');
    });
  });
});
