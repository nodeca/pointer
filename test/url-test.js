'use strict';


var Assert = require('assert');
var URL    = require('../lib/pointer/url');


function suite(url) {
  return {
    topic: url,

    'should have a protocol of http': function (url) {
      Assert.equal(url.attr('protocol'), 'http');
    },

    'should have a path of /folder/dir/index.html': function () {
      Assert.equal(url.attr('path'), '/folder/dir/index.html');
    },

    /* should it? */
    'should have an unset port': function () {
      Assert.equal(url.attr('port'), '');
    },

    'should have an host of allmarkedup.com': function () {
      Assert.equal(url.attr('host'), 'allmarkedup.com');
    },

    'should have a relative path of /folder/dir/index.html?item=value#foo': function () {
      Assert.equal(url.attr('relative'), '/folder/dir/index.html?item=value#foo');
    },

    'should have a directory of /folder/dir/': function () {
      Assert.equal(url.attr('directory'), '/folder/dir/');
    },

    'should have a file of index.html': function () {
      Assert.equal(url.attr('file'), 'index.html');
    },

    'should have a querystring of item=value': function () {
      Assert.equal(url.attr('query'), 'item=value');
    },

    'should have an anchor of foo': function () {
      Assert.equal(url.attr('fragment'), 'foo');
    },

    'should have a param() of item: "value"': function () {
      Assert.deepEqual(url.param(), {item: 'value'});
    },

    'should have a param("item") of "value"': function () {
      Assert.equal(url.param('item'), 'value');
    },

    'should have a segment() of ["folder","dir","index.html"]': function () {
      Assert.deepEqual(url.segment(), ["folder", "dir", "index.html"]);
    },

    'should have a segment(1) of "folder"': function () {
      Assert.equal(url.segment(1), "folder");
    },

    'should have a segment(-1) of "folder"': function () {
      Assert.equal(url.segment(-1), "index.html");
    }
  };
}


require('vows').describe('URL').addBatch({
  'Original suite': {
    'with strict mode':     suite(URL('http://allmarkedup.com/folder/dir/index.html?item=value#foo', true)),
    'with non-strict mode': suite(URL('http://allmarkedup.com/folder/dir/index.html?item=value#foo', false))
  },

  'Pointer cases': {
    'without protocol': {
      topic: URL('//example.com/index.html'),

      'should have no protocol': function (url) {
        Assert.equal(url.attr('protocol'), '');
      },

      'but should have other parts': function (url) {
        Assert.equal(url.attr('host'), 'example.com');
        Assert.equal(url.attr('path'), '/index.html');
      }
    },

    'without host part at all': {
      topic: URL('/index.html'),

      'should have no protocol': function (url) {
        Assert.equal(url.attr('protocol'), '');
      },

      'should have no host': function (url) {
        Assert.equal(url.attr('host'), '');
      },

      'but should have other parts': function (url) {
        Assert.equal(url.attr('path'), '/index.html');
      }
    },

    'with credentials': {
      topic: URL('http://ixti@example.com'),

      'host should contain only host': function (url) {
        Assert.equal(url.attr('host'), 'example.com');
      }
    }
  }
}).export(module);
