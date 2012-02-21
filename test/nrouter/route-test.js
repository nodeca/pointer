'use strict';


var Assert = require('assert');
var Route = require('../../lib/nrouter/route');
var Common = require('../../lib/nrouter/common');


function noop() {}


function test_matching(definitions) {
  var test = {};

  Common.each(definitions, function (options, pattern) {
    var route, assertions = {};

    route = new Route(pattern, options.params || {}, noop);
    assertions = test['~ ' + pattern] = {};

    Common.each(options.expectations, function (expect, url) {
      assertions[url + ' => ' + JSON.stringify(expect)] = function () {
        var data = route.match(url);

        if (!expect) {
          Assert.isNull(data);
        } else {
          Assert.isNotNull(data);
          Assert.deepEqual(data.params, expect);
        }
      };
    });
  });

  return test;
}

require('vows').describe('NRouter.Route').addBatch({
  'Routes are matched with "boundaries"': test_matching({
    '/articles': {
      expectations: {
        '/articles': {},
        '/articles/': false,
        '/article': false
      }
    }
  }),

  'Params are required, by default': test_matching({
    '/article/{id}': {
      expectations: {
        '/article/abc': {id: 'abc'},
        '/article/123': {id: '123'},
        '/article/': false
      }
    },
    '/article/{id}/': {
      expectations: {
        '/article/abc/': {id: 'abc'},
        '/article/123/': {id: '123'},
        '/article//': false
      }
    }
  }),

  'Optional part may be omitted': test_matching({
    '/article/{id}(-{slug})': {
      expectations: {
        '/article/123': {id: '123', slug: undefined},
        '/article/123-foobar': {id: '123', slug: 'foobar'}
      }
    }
  }),

  'Param can have matching pattern': test_matching({
    '/article/{id}(-{slug}).html': {
      params: {
        id: {match: /[0-9]{2}/},
        slug: {match: /[a-z]*/}
      },
      expectations: {
        '/article/42.html': {id: '42', slug: undefined},
        '/article/42-.html': {id: '42', slug: ''},
        '/article/42-testing.html': {id: '42', slug: 'testing'},
        '/article/42-testing.html.html': false,
        '/article/123-testing.html': false
      }
    }
  }),

  'Param specified as RegExp is a shorthand to match option': test_matching({
    '/article/{id}(-{slug}).html': {
      params: {
        id: /[0-9]{2}/,
        slug: /[a-z]*/
      },
      expectations: {
        '/article/42.html': {id: '42', slug: undefined},
        '/article/42-.html': {id: '42', slug: ''},
        '/article/42-testing.html': {id: '42', slug: 'testing'},
        '/article/42-testing.html.html': false,
        '/article/123-testing.html': false
      }
    }
  }),

  'Param can have default value': test_matching({
    '/article/{id}(-{slug})(.{format})': {
      params: {
        slug: {default: 'foobar'},
        format: {default: 'html'}
      },
      expectations: {
        '/article/42': {id: '42', slug: 'foobar', format: 'html'},
        '/article/42-habahaba': {id: '42', slug: 'habahaba', format: 'html'},
        '/article/42-habahaba.pdf': {id: '42', slug: 'habahaba', format: 'pdf'},
        '/article/42.pdf': {id: '42', slug: 'foobar', format: 'pdf'}
      }
    }
  }),

  'Param specified as non-RegExp and non-Object is a shorthand to default option': test_matching({
    '/article/{id}(-{slug})(.{format})': {
      params: {
        slug: 'foobar',
        format: 'html'
      },
      expectations: {
        '/article/42': {id: '42', slug: 'foobar', format: 'html'},
        '/article/42-habahaba': {id: '42', slug: 'habahaba', format: 'html'},
        '/article/42-habahaba.pdf': {id: '42', slug: 'habahaba', format: 'pdf'},
        '/article/42.pdf': {id: '42', slug: 'foobar', format: 'pdf'}
      }
    }
  }),

  'Params not in the route return their default values': test_matching({
    '/article/test.{format}': {
      params: {
        id: {default: 42},
        page: {match: /\d+/}
      },
      expectations: {
        '/article/test.html': {format: 'html', id: 42, page: undefined}
      }
    }
  }),

  'Dot is not a meta-char': test_matching({
    '/test.{format}': {
      expectations: {
        '/test.html': {format: 'html'},
        '/test-html': false
      }
    }
  }),

  'Question mark is a meta-char with zero-one quantifier': test_matching({
    '/test?{format}': {
      expectations: {
        '/testhtml': {format: 'html'},
        '/test.html': {format: 'html'},
        '/test-html': {format: 'html'}
      }
    }
  }),

  'Asterisk is a meta-char with zero-many quantifier': test_matching({
    '/test*{format}': {
      expectations: {
        '/testhtml': {format: 'html'},
        '/test.html': {format: 'html'},
        '/test--html': {format: 'html'}
      }
    }
  }),

  'Plus sign is a meta-char with one-many quantifier': test_matching({
    '/test*{format}': {
      expectations: {
        '/testhtml': false,
        '/test.html': {format: 'html'},
        '/test--html': {format: 'html'}
      }
    }
  })
}).export(module);
