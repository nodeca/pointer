/**
 *  class Pointer
 **/


'use strict';


var Route         = require('./pointer/route');
var Group         = require('./pointer/group');
var URL           = require('./pointer/url');
var getSortedKeys = require('./pointer/common').getSortedKeys;
var stringify     = require('./pointer/common').stringify;


/**
 *  new Pointer([routes])
 *  - routes (Object|Array): Routes map in form of `pattern: options` pairs,
 *    or Array of routes in form of `[options]`. If you need data to serialize
 *    for client, take it from [[Pointer#config]].
 *
 *  Creates new instance of router, prefilled with given routes (if provided).
 *
 *
 *  ##### See Also
 *
 *  - [[Pointer#addRoute]]
 **/
function Pointer(routes) {

  /**
   *  Pointer#config -> Array
   *
   *  Stores array of added routes, suitable for export.
   **/
  this.config = [];

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

  // prefill routes if data provided
  if (routes) {

    if (Array.isArray(routes)) {
      routes.forEach(function (route) {
        this.addRoute(route);
      }, this);

    } else {
      Object.keys(routes).forEach(function (k) {
        this.addRoute(k, routes[k]);
      }, this);
    }

  }
}


/**
 *  Pointer#stringify() -> String
 *
 *  Serialize added routes (including RegExp properties) into "executable"
 *  string, that can be used to build client code.
 **/
Pointer.prototype.stringify = function () {
  return stringify(this.config);
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
 *  Pointer#addRoute([pattern][, options]) -> Route
 *  - pattern (String): Pattern as for [[Route.new]],
 *    shortcut for `options.pattern`.
 *  - options (Object): Route options, see below.
 *
 *  Create and add new route.
 *
 *
 *  ##### Options
 *
 *  Second argument of `addRoute` is options. It consist of following keys:
 *
 *  -   *pattern* (Optional, String): will be used as the pattern for
 *      [[Route.new]] if `pattern` argument is omited.
 *
 *  -   *name*    (Optional, String|Array): name or list of names of the route.
 *      Used to build URLs with [[Pointer#linkTo]].
 *      Several routes may have same name, see [[Pointer#linkTo]] for
 *      detailed information.
 *
 *  -   *prefix*  (Optional, String): think of it as of mount point.
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
  if ('undefined' === typeof options) {
    if ('object' === typeof pattern) {
      options = pattern;
      pattern = options.pattern;
    } else {
      options = {};
    }
  }

  var route,
      prefix  = getURLParts(options.prefix || ''),
      host    = prefix.host,
      proto   = prefix.proto,
      path    = prefix.path,
      store   = this.__routes__,
      nameList;

  //
  // Store original route, to allow export all config to client
  // Clone options to keep params intact
  //

  var routeCfg = {};

  Object.keys(options).forEach(function (k) {
    routeCfg[k] = options[k];
  });
  routeCfg.pattern = pattern;

  this.config.push(routeCfg);


  route = new Route(pattern, options.params, options.meta, options.prefix);

  //
  // save named route for linkTo
  //

  if (options.name) {
    nameList = options.name;

    if (!Array.isArray(nameList)) {
      nameList = [ nameList ];
    }

    nameList.forEach(function (name) {
      if (!this.__named_routes__[name]) {
        this.__named_routes__[name] = [];
      }

      this.__named_routes__[name].push(route);
    }, this);
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


function __match__(pointer, url, matchAll) {
  var urlParts = getURLParts(url),
      resultArray = [],
      resultSingle;

  // if hostname is given, try it first, and then fallback to '*', e.g.:
  //
  // for 'http://example.com/foobar', try 'example.com' and then '*'
  // for '/foobar', try '*' only
  var hostVariants = ('*' === urlParts.host) ? [ '*' ] : [ urlParts.host, '*' ];

  // if protocol is given, try it first, and then then fallback to '*', e.g.:
  //
  // for 'http://example.com/foobar', try 'http' and then '*'
  // for '//example.com/foobar' and '/foobar', try '*' only
  var protoVariants = ('*' === urlParts.proto) ? [ '*' ] : [ urlParts.proto, '*' ];

  // scan hosts
  hostVariants.forEach(function (host) {
    if (resultSingle) {
      return false; // route found - stop
    }

    if (!pointer.__routes__[host]) {
      return;
    }

    // scan protocols
    protoVariants.forEach(function (proto) {
      if (resultSingle) {
        return false; // route found - stop
      }

      var store = pointer.__routes__[host][proto];

      if (!store) {
        return;
      }

      // scan paths
      store.cachedGroupsKeys.forEach(function (prefix) {
        var group = store.groups[prefix], path = urlParts.path;

        // prefix can be a regexp of path or null
        if (null !== group.re) {
          path = path.replace(group.re, '');

          // prefix regexp removed nothing - that means it does not match path
          if (path === urlParts.path) {
            return;
          }
        }

        // try find route in the group
        if (matchAll) {
          resultArray = group.routes.matchAll(path, resultArray);
        } else {
          resultSingle = group.routes.match(path);

          // if found - continue with other host/protocol combinations
          if (resultSingle) {
            return false;
          }
        }
      });
    });
  });

  return matchAll ? resultArray : (resultSingle || null);
}


/**
 *  Pointer#match(url) -> Object|Null
 *  - url (String): URL to find mathing route for.
 *
 *  Returns first matching route or false if none found.
 *  See [[Route#match]] for details of matched data Object.
 **/
Pointer.prototype.match = function match(url) {
  return __match__(this, url, false);
};


/**
 *  Pointer#matchAll(url) -> Array
 *  - url (String): URL to find mathing routes for.
 *
 *  Returns all matching routes or an empty array if none found.
 *  Each element of the resulting array is result of [[Route#match]] call.
 **/
Pointer.prototype.matchAll = function matchAll(url) {
  return __match__(this, url, true);
};


/**
 *  Pointer#linkTo(name[, params[, linkDefaults]]) -> String|Null
 *  - name (String): Name of the URL (or group of URLs).
 *  - params (Object): Params to feed to URL builder.
 *  - linkDefaults (Object): hash of default values for resulting URL
 *    `protocol`, `hostname`, and `port`.
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
Pointer.prototype.linkTo = function linkTo(name, params, linkDefaults) {
  var i, l, routes = this.__named_routes__[name] || [], url = null;

  // find route that returns longest URL with given params
  for (i = 0, l = routes.length; i < l; i++) {
    var tmp = routes[i].buildURL(params, linkDefaults);

    // we want to return the longest match
    if (null === url || url.length < tmp.length) {
      url = tmp;
    }
  }

  return url;
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
