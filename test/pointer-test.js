/*global describe, it*/


"use strict";


var assert  = require("assert");
var Pointer = require("..");


////////////////////////////////////////////////////////////////////////////////


describe("Pointer", function () {
  describe("#linkTo", function () {
    var pointer = new Pointer({
      "/foo/{id}/index.html": { name: "foo", params: { id: /\d+?/ } },
      "/bar/index.html":      { name: "bar" }
    });


    it("should respect name", function () {
      assert.deepEqual(pointer.linkTo("foo", {}), null);
      assert.deepEqual(pointer.linkTo("foo", { id: 42 }), "/foo/42/index.html");
    });
  });


  describe("#match", function () {
    var pointer = new Pointer({
      "/foo/{id}": { prefix: "//example.com" }
    });


    it("should respect prefix", function () {
      var match = pointer.match("//example.com/foo/42");
      assert.deepEqual(match && match.params, { id: "42" });
    });


    // issue#2: https://github.com/nodeca/pointer/issues/2
    describe.skip("with similar routes", function () {
      var pointer = new Pointer({
        "/tests(/{a}(/{b}(/{c}(/{d}))))": { meta: "uno" },
        "/tests/{a}/{b}/{c}/fun(/{d})":   { meta: "dos" }
      });


      it("should find correct route", function () {
        var match;

        match = pointer.match("/tests/pluto");
        assert.equal(match && match.meta, "uno");

        match = pointer.match("/tests/1/2/3/fun");
        assert.equal(match && match.meta, "dos");
      });
    });
  });
});
