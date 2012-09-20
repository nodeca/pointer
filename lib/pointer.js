/**
 *  class Pointer
 **/


'use strict';


var each  = require('./pointer/common').each;
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
  // all routes grouped by prefixes
  //
  //  {
  //    '*': [ Route(), ... ],
  //    '//example.com': [ Route(), ... ]
  //  }
  //
  this.__routes__ = {};

  // cache of RegExps for known prefixes, grouped by host and protocol:
  //
  //  {
  //    'example.com': {
  //      'https': {
  //        'https://users.example.com': null,
  //      },
  //      '*': { // any protocol
  //        '//example.com': null,
  //        '//example.com/admin': /^\/admin/
  //      }
  //    }
  //  }
  //
  this.__prefixes__ = {};

  // routes grouped by names (needed for linkTo)
  this.__named_routes__ = {};

  // prefill routes if map provided
  each(routes, function (options, pattern) {
    this.addRoute(pattern, options);
  }, this);
}


/** alias of: Pointer.new
 *  Pointer.create([routes]) -> Pointer
 *
 *  Constructor proxy.
 **/
Pointer.create = function create(routes) {
  return new Pointer(routes);
};


// helper to lazily initialize named stack inside object and push value into it
//
function lazyStackPush(obj, name, value) {
  if (!obj[name]) {
    obj[name] = [];
  }

  obj[name].push(value);
}


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


// prepares and saves regexp for the prefix under internal cache
//
function setPrefixRegExp(store, prefix) {
  var parsed = getURLParts(prefix);

  store = store[parsed.host] || (store[parsed.host] = {});
  store = store[parsed.proto] || (store[parsed.proto] = {});
  store[prefix] = parsed.path ? new RegExp('^' + parsed.path) : null;
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
  var route;

  options = options || {};
  route   = new Route(pattern, options.params, options.meta, options.prefix);

  // save route under prefix (* - means no prefix)
  lazyStackPush(this.__routes__, options.prefix || '*', route);

  // save named route
  if (options.name) {
    lazyStackPush(this.__named_routes__, options.name, route);
  }

  if (options.prefix) {
    setPrefixRegExp(this.__prefixes__, options.prefix);
  }

  return route;
};


// returns protocol|host alternatives where to search prefix regexps
//
function variants(str) {
  return '*' === str ? [ '*' ] : [ str, '*' ];
}


// returns object's keys sorted alphabeticaly in descending order
//
function getSortedKeys(obj) {
  var keys = [], k;

  for (k in obj) {
    if (obj.hasOwnProperty(k)) {
      keys.push(k);
    }
  }

  keys.sort();
  keys.reverse();

  return keys;
}


// iterates through array calling iterator on each element.
// stops as soon as iterator return non-falsy value, and returns this value
//
function find(arr, iter) {
  var result;

  each(arr, function (val) {
    result = iter(val);
    return !result;
  });

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
      data = getURLParts(url);

  return find(variants(data.host), function (host) {
    if (!self.__prefixes__[host]) {
      return;
    }

    return find(variants(data.proto), function (proto) {
      if (!self.__prefixes__[host][proto]) {
        return;
      }

      return find(getSortedKeys(self.__prefixes__[host][proto]), function (prefix) {
        var path = data.path;

        // prefix can be a regexp of path or null
        if (null !== self.__prefixes__[host][proto][prefix]) {
          path = path.replace(self.__prefixes__[host][proto][prefix], '');

          // prefix regexp removed nothing - that means it does not match path
          if (path === data.path) {
            return;
          }
        }

        return find(self.__routes__[prefix], function (route) {
          return route.match(path);
        });
      });
    });
  }) || find(self.__routes__['*'], function (route) {
    return route.match(data.path) || route.match(url);
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
  var url = null;

  // find route thet returns longest URL with given params
  each(this.__named_routes__[name], function (route) {
    var tmp = route.buildURL(params);

    // we want return the longest matching
    if (null === url || url.length < tmp.length) {
      url = tmp;
    }
  });

  return url;
};


/**
 *  Pointer.createLinkBuilder(pattern[, params]) -> Function
 *  - pattern (String): Pattern as for [[Route.new]]
 *  - params (Object): Params as for [[Route.new]]
 *
 *  Returns function that can be used to build URL for given `pattern` with
 *  provided `params`.
 *
 *
 *  ##### Builder signature
 *
 *      function builder(params) -> String|Null
 *
 *
 *  ##### Example
 *
 *      var builder = Pointer.createLinkBuilder('/foo/{bar}', {
 *        bar: /[a-z]+/
 *      });
 *
 *      builder();              // -> null
 *      builder({bar: 123});    // -> null
 *      builder({bar: 'abc'});  // -> '/foo/abc'
 **/
Pointer.createLinkBuilder = function createLinkBuilder(pattern, params) {
  var // proxy to URL builder via detached route
      r = new Route(pattern, params);

  return function (params) {
    return r.buildURL(params || {});
  };
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
