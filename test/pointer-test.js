'use strict';


var Assert = require('assert');
var each    = require('./helper').each;
var Pointer = require('..');


var pointer = new Pointer({
  '/articles/{id}(-{slug}(-{page}))(.{format})': {
    name: 'article',
    params: {
      id: /\d+?/,
      page: {
        match: /\d+?/,
        default: 1
      },
      format: 'html'
    }
  },

  '/articles/{id}(-{page})(.{format})': {
    name: 'article',
    params: {
      id: /\d+?/,
      page: /\d+?/,
      format: 'html'
    }
  },

  '/posts/{year}(-{month}(-{day}))-{slug}.html': {
    name: 'post',
    params: {
      year: /\d+/,
      month: /\d+/,
      day: /\d+/
    }
  },

  '/{year}-{month}-{day}-{slug}.html': {
    name: 'blog',
    prefix: '/blog'
  },

  '/{user}.html': {
    name: 'users',
    prefix: '//users.example.com/profile'
  },

  '/login': {
    name: 'login',
    prefix: 'https://example.com'
  },


  '/f{id}(/p{page})': {
    name: 'forum.threads',
    params: {
      id: /\d+/,
      page: {
        match:   /\d+/,
        default: 1
      }
    }
  }
});


function test_generated_links(definitions) {
  var tests = {};

  each(definitions, function (data, url) {
    tests['[' + data.name + '] ' + url + ' << ' + JSON.stringify(data.params)] = function () {
      var result = pointer.linkTo(data.name, data.params);

      if (!url || 'null' === url) {
        Assert.isNull(result);
      } else {
        Assert.isNotNull(result);
        Assert.equal(result, url);
      }
    };
  });

  return tests;
}


function test_route_matcher(definitions) {
  var tests = {};

  each(definitions, function (params, url) {
    tests[url + ' >> ' + JSON.stringify(params)] = function () {
      var result = pointer.match(url);

      if (!params || 'null' === params) {
        Assert.isNull(result);
      } else {
        Assert.isNotNull(result);
        Assert.deepEqual(result.params, params);
      }
    };
  });

  return tests;
}


require('vows').describe('Pointer').addBatch({
  'Building links': {
    'based on `name` to find route to build URL for': test_generated_links({
      '/posts/2012-02-23-foobar.html': {
        name: 'post',
        params: {year: 2012, month: '02', day: 23, slug: 'foobar'}
      },
      null: {
        name: 'post',
        params: {id: 42, slug: 'foobar', page: 1, format: 'html'}
      }
    }),

    'returns longest URL when multiple URLs share same `name`': test_generated_links({
      '/articles/42-foobar': {
        name: 'article',
        params: {id: 42, slug: 'foobar', page: 1, format: 'html'}
      },
      '/articles/42-123456': {
        name: 'article',
        params: {id: 42, page: 123456, format: 'html'}
      }
    }),

    'respests param matchers': test_generated_links({
      null: {
        name: 'article',
        params: {id: 'foo', page: 'bar', format: 'html'}
      }
    }),

    'preserves prefix': test_generated_links({
      '/blog/2012-02-23-foobar.html': {
        name: 'blog',
        params: {year: 2012, month: '02', day: 23, slug: 'foobar'}
      },

      '//users.example.com/profile/ixti.html': {
        name: 'users',
        params: {user: 'ixti'}
      },

      'https://example.com/login': {
        name: 'login'
      }
    }),

    'allow omit optinal params': test_generated_links({
      '/f123': {
        name:   'forum.threads',
        params: {id: 123}
      }
    }),

    'skips optinal params with default value': test_generated_links({
      '/f123': {
        name:   'forum.threads',
        params: {id: 123, page: 1}
      }
    }),

    'skips optinal params with invalid value': test_generated_links({
      '/f123': {
        name:   'forum.threads',
        params: {id: 123, page: 'abc'}
      }
    })
  },

  'Finding matching route': {
    'respects default values of params': test_route_matcher({
      '/articles/42-foobar-5.html': {id: '42', slug: 'foobar', page: '5', format: 'html'},
      '/articles/42-foobar.html': {id: '42', slug: 'foobar', page: 1, format: 'html'},
      '/posts/2012-foobar.html': {year: 2012, month: undefined, day: undefined, slug: 'foobar'}
    }),

    'respects prefixes': test_route_matcher({
      '/posts/2012-02-23-foobar.html': {year: 2012, month: '02', day: 23, slug: 'foobar'},
      '/blog/2012-02-23-foobar.html': {year: 2012, month: '02', day: 23, slug: 'foobar'}
    }),

    'respects protocols within prefixes': test_route_matcher({
      '//users.example.com/profile/ixti.html': {user: 'ixti'},
      'http://users.example.com/profile/ixti.html': {user: 'ixti'},
      'https://users.example.com/profile/ixti.html': {user: 'ixti'},
      'http://example.com/login': null,
      'https://example.com/login': {}
    }),

    'respects domains within prefixes': test_route_matcher({
      '//example.com/profile/ixti.html': null
    })
  }
}).export(module);
