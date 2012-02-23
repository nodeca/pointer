'use strict';


var Assert = require('assert');
var Route = require('../../../lib/nrouter/route');
var Common = require('../../../lib/nrouter/common');


function noop() {}


function test_builder(definitions) {
  var test = {};

  Common.each(definitions, function (options, pattern) {
    var route, assertions;

    route = new Route(pattern, {}, noop);
    assertions = test['~ ' + pattern] = {};

    Common.each(options.expectations, function (params, expectUrl) {
      (Array.isArray(params) ? params : [params]).forEach(function (params) {
        assertions[expectUrl + ' << ' + JSON.stringify(params)] = function () {
          var data = route.buildURL(params);

          if (!expectUrl || 'null' === expectUrl) {
            Assert.isNull(data);
          } else {
            Assert.isNotNull(data);
            Assert.equal(data, expectUrl);
          }
        };
      });
    });
  });

  return test;
}


require('vows').describe('NRouter.Route.Builder').addBatch({
  'Building URLS': test_builder({
    '/article/{id}(-{slug}(-{page}))(.{format})': {
      expectations: {
        null: {},
        '/article/123': [
          {id: 123},
          {id: 123, page: 42}
        ],
        '/article/123.pdf': [
          {id: 123, format: 'pdf'},
          {id: 123, page: 42, format: 'pdf'}
        ],
        '/article/123-foobar': [
          {id: 123, slug: 'foobar'}
        ],
        '/article/123-foobar-42': [
          {id: 123, slug: 'foobar', page: 42}
        ],
        '/article/123-foobar.html': [
          {id: 123, slug: 'foobar', format: 'html'}
        ],
        '/article/123-foobar-42.html': [
          {id: 123, slug: 'foobar', page: 42, format: 'html'}
        ]
      }
    }
  })
}).export(module);
