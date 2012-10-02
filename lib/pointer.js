/**
 *  class Pointer
 **/


'use strict';


var Route = require('./pointer/route');
var URL   = require('./pointer/url');


/**
 *  new Pointer([routes])
 *  - routes (Object): Routes map in form of `pattern: options` pairs.
 *
 *  Creates new instance of router, prefilled with given routes (if provided).
 *
 *
 *  ##### See Also
 *
 *  - [[Pointer#addRoute]]
 **/
function Pointer(routes) {
  var k;

  // all routes grouped by prefixes (mount points, see addRoute):
  //
  //    https://example.com/foobar
  //      -> { proto: 'https', host: 'example.com', path: '/foobar' }
  //
  //    https://example.com
  //      -> { proto: 'https', host: 'example.com', path: '' }
  //
  //    //example.com
  //      -> { proto: '*', host: 'example.com', path: '' }
  //
  //    /foobar
  //      -> { proto: '*', host: '*', path: '/foobar' }
  //
  //  {
  //    'example.com': { // host
  //      'https': { // proto
  //        groups: {
  //          '': { // path
  //            re: null,
  //            routes: [ Route(), ... ]
  //          }
  //        },
  //        cachedGroupKeys: [ '' ]
  //      },
  //      '*': {
  //        groups: {
  //          '': {
  //            re: null,
  //            routes: [ Route(), ... ]
  //          },
  //          '/admin': {
  //            re: /^\/admin/,
  //            routes: [ Route(), ... ]
  //          }
  //        },
  //        cachedGroupKeys: [ '/admin', '' ]
  //      }
  //    }
  //  }
  //
  this.__routes__ = {};

  // routes grouped by names (needed for linkTo)
  this.__named_routes__ = {};

  // prefill routes if map provided
  if (routes) {
    for (k in routes) {
      if (routes.hasOwnProperty(k)) {
        this.addRoute(k, routes[k]);
      }
    }
  }
}


/** alias of: Pointer.new
 *  Pointer.create([routes]) -> Pointer
 *
 *  Constructor proxy.
 **/
Pointer.create = function create(routes) {
  return new Pointer(routes);
};


// helper to parse URL into proto, host and path respecting our internal
// structures, so that proto|path is `*` if it's not provided.
//
function getURLParts(url) {
  var parsed = URL(url);

  return {
    proto:  parsed.attr('protocol') || '*',
    host:   parsed.attr('host') || '*',
    path:   parsed.attr('relative') || ''
  };
}


/**
 *  Pointer#addRoute(pattern[, options]) -> Route
 *  - pattern (String): Pattern as for [[Route.new]]
 *  - options (Object): Route options, see below.
 *
 *  Create and add new route.
 *
 *
 *  ##### Options
 *
 *  Second argument of `addRoute` is options. It consist of following keys:
 *
 *  -   *name*    (Optional, String): name of the route.
 *      Used to build URLs with [[Pointer#linkTo]].
 *      Several routes may have same name, see [[Pointer#linkTo]] for
 *      detailed information.
 *
 *  -   *prefix*  (Optional, String): think of it as of mount point.
 *      You can use `prefix()` as well, which is a syntax sugar
 *      that sets this option.
 *
 *  -   *params*  (Optional, Object): options of params in the route.
 *      See [[Route.new]] for details.
 *
 *  -   *meta* (Optional, Mixed): meta data to mix into match object.
 *      See [[Route.new]] for details.
 *
 *
 *  ##### See Also:
 *
 *  - [[Route.new]]
 **/
Pointer.prototype.addRoute = function addRoute(pattern, options) {
  var route,
      prefix  = getURLParts(options.prefix || ''),
      host    = prefix.host,
      proto   = prefix.proto,
      path    = prefix.path,
      store   = this.__routes__;

  options = options || {};
  route   = new Route(pattern, options.params, options.meta, options.prefix);

  //
  // save named route
  //

  if (options.name) {
    if (!this.__named_routes__[options.name]) {
      this.__named_routes__[options.name] = [];
    }

    this.__named_routes__[options.name].push(route);
  }

  //
  // save route under corresponding host/port
  //

  if (!store[host]) {
    store[host] = {};
  }

  if (!store[host][proto]) {
    store[host][proto] = { groups: {} };
  }

  // invalidate known keys in case if addRoute
  // was called after keys were populated by matcher
  store[host][proto].cachedGroupKeys = null;

  if (!store[host][proto].groups[path]) {
    store[host][proto].groups[path] = {
      re:     prefix.path ? new RegExp('^' + prefix.path) : null,
      routes: []
    };
  }

  store[host][proto].groups[path].routes.push(route);

  return route;
};


// returns object's keys sorted alphabeticaly in descending order
//
//    getSortedKeys({ a: 1, cba: 2, ba: 3 });
//    // -> [ 'cba', 'ba', 'a' ]
//
function getSortedKeys(obj) {
  var keys = [], k;

  for (k in obj) {
    if (obj.hasOwnProperty(k)) {
      keys.push(k);
    }
  }

  return keys.sort(function (a, b) {
    a = String(a).length;
    b = String(b).length;

    if (a === b) {
      return 0;
    }

    // longest strings comes first
    return (a > b) ? -1 : 1;
  });
}


// iterates through array calling iterator on each element.
// stops as soon as iterator return non-falsy value, and returns this value
//
function find(arr, iter) {
  var i, l, result;

  for (i = 0, l = arr.length; i < l; i++) {
    result = iter(arr[i]);

    if (result) {
      return result;
    }
  }

  return result;
}


/**
 *  Pointer#match(url) -> Object|Null
 *  - url (String): URL to find mathing route for.
 *
 *  Returns first matching route or false if none found.
 *  See [[Route#match]] for details of matched data Object.
 **/
Pointer.prototype.match = function match(url) {
  var self = this,
      data = getURLParts(url),
      host_variants   = ('*' === data.host) ? [ '*' ] : [ data.host, '*' ],
      proto_variants  = ('*' === data.proto) ? [ '*' ] : [ data.proto, '*' ];

  // scan hosts
  return find(host_variants, function (host) {
    if (!self.__routes__[host]) {
      return;
    }

    // scan protocols
    return find(proto_variants, function (proto) {
      var store = self.__routes__[host][proto], keys;

      if (!store) {
        return;
      }

      keys = store.cachedGroupKeys || (store.cachedGroupKeys = getSortedKeys(store.groups));

      // scan paths
      return find(keys, function (prefix) {
        var group = store.groups[prefix], path = data.path;

        // prefix can be a regexp of path or null
        if (null !== group.re) {
          path = path.replace(group.re, '');

          // prefix regexp removed nothing - that means it does not match path
          if (path === data.path) {
            return;
          }
        }

        // scan routes
        return find(group.routes, function (route) {
          return route.match(path);
        });
      });
    });
  }) || null;
};


/**
 *  Pointer#linkTo(name[, params]) -> String|Null
 *  - name (String): Name of the URL (or group of URLs).
 *  - params (Object): Params to feed to URL builder.
 *
 *  Creates pretty URL for the route registered with given `name`.
 *  If there were several routes registered with such `name`, the one that
 *  produce the longest URL is used.
 *
 *
 *  ##### See Also
 *
 *  - [[Route#buildURL]]
 **/
Pointer.prototype.linkTo = function linkTo(name, params) {
  return find(this.__named_routes__[name] || [], function (route) {
    return route.buildURL(params);
  }) || null;
};


/**
 *  Pointer.parseURL(url) -> Object
 *  - url (String): URL to parse
 *
 *  Returns parts of parsed URL:
 *
 *  - `protocol`: eg. `http`, `https`, `file`, etc.
 *  - `host`: eg. `www.mydomain.com`, `localhost`, etc.
 *  - `port`: eg. `80`
 *  - `path`: the path to the file (eg. `/folder/dir/index.html`)
 *  - `query`: the entire querystring, eg. `item=value&item2=value2`
 *  - `anchor`: the entire string after the `#` symbol
 **/
Pointer.parseURL = function parseURL(url) {
  var o = URL(url);

  return {
    protocol: o.attr('protocol'),
    host:     o.attr('host'),
    port:     o.attr('port'),
    path:     o.attr('path'),
    query:    o.attr('query'),
    anchor:   o.attr('fragment')
  };
};


// MODULE EXPORTS //////////////////////////////////////////////////////////////


module.exports = Pointer;
