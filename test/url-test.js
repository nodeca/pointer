/*global describe, it*/


"use strict";


var assert = require("assert");
var URL    = require("../lib/pointer/url");


////////////////////////////////////////////////////////////////////////////////


describe("Pointer.URL", function () {
  it("should allow omit protocol", function () {
    var parsed = URL("//example.com/index.html");

    assert.equal("/index.html", parsed.attr("path"));
    assert.equal("example.com", parsed.attr("host"));
    assert.equal("",            parsed.attr("protocol"));
  });


  it("should allow omit host part", function () {
    var parsed = URL("/index.html");

    assert.equal("/index.html", parsed.attr("path"));
    assert.equal("",            parsed.attr("host"));
    assert.equal("",            parsed.attr("protocol"));
  });


  it("should remove auth part from host", function () {
    var parsed = URL("http://ixti:1234@example.com/");

    assert.equal("ixti",        parsed.attr("user"));
    assert.equal("1234",        parsed.attr("password"));
    assert.equal("example.com", parsed.attr("host"));
  });
});
