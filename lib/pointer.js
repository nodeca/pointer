/**
 *  class Pointer
 **/


'use strict';


var Route         = require('./pointer/route');
var Group         = require('./pointer/group');
var URL           = require('./pointer/url');
var find          = require('./pointer/common').find;
var getSortedKeys = require('./pointer/common').getSortedKeys;


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
  //            routes: Group(Route(), ...)
  //          }
  //        },
  //        cachedGroupsKeys: [ '' ]
  //      },
  //      '*': {
  //        groups: {
  //          '': {
  //            re: null,
  //            routes: Group(Route(), ...)
  //          },
  //          '/admin': {
  //            re: /^\/admin/,
  //            routes: Group(Route(), ...)
  //          }
  //        },
  //        cachedGroupsKeys: [ '/admin', '' ]
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
    host:   parsed.attr('host')     || '*',
    path:   parsed.attr('path')     || '',
    anchor: parsed.attr('fragment') || ''
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
 *  -   *name* (Optional, String): name of the route.
 *      Used to build URLs with [[Pointer#linkTo]].
 *      Several routes may have same name, see [[Pointer#linkTo]] for
 *      detailed information.
 *
 *  -   *prefix* (Optional, String): think of it as of mount point.
 *
 *  -   *params* (Optional, Object): options of params in the route.
 *      See [[Route.new]] for details.
 *
 *  -   *meta* (Optional, Mixed): meta data to mix into match object.
 *      See [[Route.new]] for details.
 *
 *  -   *anchor* (Optional, String): allows to specify URL's anchor to match
 *      using the same format as for `pattern` and without heading '#' character.
 *      Note, `anchor` is always optional. It doesn't affect if the route can be
 *      matched or not.
 *
 *  -   *anchorParams* (Optional, Object): options of anchor params in the route.
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
  route   = new Route(pattern, options);

  //
  // save named route for linkTo
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

  if (!store[host][proto].groups[path]) {
    store[host][proto].groups[path] = {
      re:     prefix.path ? new RegExp('^' + prefix.path) : null,
      routes: new Group()
    };

    // rebuild groups keys cache
    store[host][proto].cachedGroupsKeys = getSortedKeys(store[host][proto].groups);
  }

  store[host][proto].groups[path].routes.push(route);

  return route;
};


/**
 *  Pointer#match(url) -> Object|Null
 *  - url (String): Full URL to match route against.
 *
 *  Returns `Object` with matching data (see below) if [[Route]] matches against
 *  given `url`:
 *
 *  - *params* (Object): Params collected from the URL's base
 *    (i.e. without anchor).
 *  - *anchorParams* (Object|Null): Params collected from the URL's anchor.
 *    Null if anchor is not matched.
 *  - *meta* (Mixed): Meta data associated with route.
 **/
Pointer.prototype.match = function match(url) {
  var self = this, data = getURLParts(url);

  // if hostname is given, try it first, and then fallback to '*', e.g.:
  //
  // for 'http://example.com/foobar', try 'example.com' and then '*'
  // for '/foobar', try '*' only
  var host_variants = ('*' === data.host) ? [ '*' ] : [ data.host, '*' ];

  // if protocol is given, try it first, and then then fallback to '*', e.g.:
  //
  // for 'http://example.com/foobar', try 'http' and then '*'
  // for '//example.com/foobar' and '/foobar', try '*' only
  var proto_variants = ('*' === data.proto) ? [ '*' ] : [ data.proto, '*' ];

  // scan hosts
  return find(host_variants, function (host) {
    if (!self.__routes__[host]) {
      return;
    }

    // scan protocols
    return find(proto_variants, function (proto) {
      var store = self.__routes__[host][proto];

      if (!store) {
        return;
      }

      // scan paths
      return find(store.cachedGroupsKeys, function (prefix) {
        var group  = store.groups[prefix],
            path   = data.path,
            anchor = data.anchor;

        // prefix can be a regexp of path or null
        if (null !== group.re) {
          path = path.replace(group.re, '');

          // prefix regexp removed nothing - that means it does not match path
          if (path === data.path) {
            return;
          }
        }

        // scan routes
        return group.routes.match(path, anchor);
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
