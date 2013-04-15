/*global describe, it*/


"use strict";


var assert  = require("assert");
var Route   = require("../../lib/pointer/route");


////////////////////////////////////////////////////////////////////////////////


// simple macros to test resulting `.params` of route.match if any
function testMatch(route, url, expectedParams) {
  var match = route.match(url);
  assert.deepEqual(match && match.params, expectedParams);
}


////////////////////////////////////////////////////////////////////////////////


describe("Pointer.Route", function () {
  describe("#match", function () {
    it("should match with boundaries", function () {
      var route = new Route("/articles");

      testMatch(route, "/articles/", null);
      testMatch(route, "/articles",  {});
    });


    it("should require params", function () {
      var route = new Route("/article/{id}");

      testMatch(route, "/article/",     null);
      testMatch(route, "/article/abc",  { id: "abc" });
      testMatch(route, "/article/123",  { id: "123" });
    });


    it("should allow omit optional groups", function () {
      var route = new Route("/{id}(-{slug})");

      testMatch(route, "/42",     { id: "42", slug: undefined });
      testMatch(route, "/42-bar", { id: "42", slug: "bar" });
    });


    it("should match param patterns", function () {
      var route = new Route("/foo/{id}.html", {
        id: { match: /[0-9]{2}/ }
      });

      testMatch(route, "/foo/42.html",   { id: "42" });
      testMatch(route, "/foo/123.html",  null);
    });


    it("should match anchor if present", function () {
      var route, match;

      route = new Route("/foo(/{name})", "bar{id}", {
        id: { match: /[0-9]+/ }
      });

      match = route.match("/foo/joe");
      assert.deepEqual(match && match.params, { name: 'joe', id: undefined });

      match = route.match("/foo/moe", "bar42");
      assert.deepEqual(match && match.params, { name: 'moe', id: '42' });
    });


    it("should properly set `hasAnchor` property in match result", function () {
      var route, match;

      route = new Route("/foo(/{name})", "bar{id}", {
        id: { match: /[0-9]+/ }
      });

      match = route.match("/foo/joe");
      assert(match);
      assert.strictEqual(match.hasAnchor, false);

      match = route.match("/foo/moe", "bar42");
      assert(match);
      assert.strictEqual(match.hasAnchor, true);
    });


    describe("when param is given as RegExp", function () {
      it("should be a shorthand to `match` option", function () {
        var route = new Route("/foo/{id}.html", { id: /[0-9]{2}/ });

        testMatch(route, "/foo/42.html",   { id: "42" });
        testMatch(route, "/foo/123.html",  null);
      });
    });


    it("allows specify default value of params", function () {
      var route = new Route("/foo/{id}(.{format})", {
        format: { default: "html" }
      });

      testMatch(route, "/foo/42",       { id: "42", format: "html" });
      testMatch(route, "/foo/42.json",  { id: "42", format: "json" });
    });


    describe("when param is given as non-Object and not RegExp", function () {
      it("should be a shorthand to `default` option", function () {
        var route = new Route("/foo/{id}(.{format})", { format: "html" });

        testMatch(route, "/foo/42",       { id: "42", format: "html" });
        testMatch(route, "/foo/42.json",  { id: "42", format: "json" });
      });
    });


    it("should return default value of params not in the pattern", function () {
      var route = new Route("/question.html", { answer: 42 });

      testMatch(route, "/question.html", { answer: 42 });
    });


    it("should escape RegExp metachars", function () {
      var route = new Route("/foo[bar]*?/baz.{format}");

      testMatch(route, "/foo[bar]*?/baz.html", { format: "html" });
    });


    it("should throw Error on duplicate param name", function () {
      assert.throws(function () {
        return new Route("/f{id}/t{id}");
      }, Error);
    });
  });


  describe("#buildURL", function () {
    it("should fail if required param is missing", function () {
      var route = new Route("/foobar/{id}");
      assert.deepEqual(route.buildURL({}), null);
    });


    it("should skip missing optional groups", function () {
      var route = new Route("/foobar/{id}(-{slug}(.{ext}))");

      assert.deepEqual(route.buildURL({
        id: 42
      }), "/foobar/42");

      assert.deepEqual(route.buildURL({
        id:   42,
        slug: "the-answer"
      }), "/foobar/42-the-answer");

      assert.deepEqual(route.buildURL({
        id:   42,
        slug: "the-answer",
        ext:  "html"
      }), "/foobar/42-the-answer.html");
    });


    it("should add anchor only when there are some params for it", function () {
      var route = new Route("/foo/{name}", "bar{id}");

      assert.deepEqual(route.buildURL({
        name: "something"
      }), "/foo/something");

      assert.deepEqual(route.buildURL({
        name: "something",
        id:   42
      }), "/foo/something#bar42");
    });


    // FIXME: Bug or feature???
    it("should not respect params matcher", function () {
      var route = new Route("/foo/{id}", { id: /\d+/ });
      assert.deepEqual(route.buildURL({ id: "bar" }), "/foo/bar");
    });


    it("should preserve prefix", function () {
      var route = new Route("/foobar/{id}", {}, {}, "//example.com");
      assert.deepEqual(route.buildURL({ id: 42 }), "//example.com/foobar/42");
    });
  });
});
