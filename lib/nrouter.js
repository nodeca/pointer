/**
 *  class NRouter
 **/


'use strict';


var Common = require('./nrouter/common');
var Route = require('./nrouter/route');


/**
 *  new NRouter([routes])
 *  - routes (Object): Routes map in form of `pattern: options` pairs.
 *
 *  Creates new instance of router, prefilled with given routes (if provided).
 *
 *
 *  ##### See Also
 *
 *  - [[NRouter#addRoute]]
 **/
var NRouter = module.exports = function NRouter(routes) {
  // all routes grouped by prefixes
  this.__routes__           = {__generic__: []};

  // cache of RegExps for known prefixes
  this.__prefix_regexps__   = {};

  // routes grouped by names (needed for linkTo)
  this.__named_routes__     = {};

  // prefill routes if map provided
  Common.each(routes, function (options, pattern) {
    this.addRoute(pattern, options);
  }, this);
};


/** alias of: NRouter.new
 *  NRouter.create([routes]) -> NRouter
 *
 *  Constructor proxy.
 **/
NRouter.create = function create(routes) {
  return new NRouter(routes);
};


/**
 *  NRouter#addRoute(pattern, options) -> Route
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
 *      Used to build URLs with [[NRouter#linkTo]].
 *      Several routes may have same name, see [[NRouter#linkTo]] for
 *      detailed information.
 *
 *  -   *prefix*  (Optional, String): think of it as of mount point.
 *      You can use `prefix()` as well, which is a syntax sugar
 *      that sets this option.
 *
 *  -   *params*  (Optional, Object): options of params in the route.
 *      See [[Route.new]] for details.
 *
 *  -   *handler* (Function): Function that sould be returned upon route match.
 *
 *
 *  ##### See Also:
 *
 *  - [[Route.new]]
 **/
NRouter.prototype.addRoute = function addRoute(match, options) {
  var route, group = '__generic__';

  if (options.prefix) {
    group = options.prefix;
    match = options.prefix + match;
  }

  route = new Route(match, options.params || {}, options.handler);

  // create new routes container for the group (prefix)
  // and cache prefix regexp
  if (!this.__routes__[group]) {
    this.__routes__[group] = [];
    this.__prefix_regexps__[group] = new RegExp('^' + options.prefix);
  }

  // if name given - push route into named stack for linkTo
  if (options.name) {
    if (!this.__named_routes__[options.name]) {
      this.__named_routes__[options.name] = [];
    }
    this.__named_routes__[options.name].push(route);
  }

  this.__routes__[group].push(route);
  return route;
};


/**
 *  NRouter#match(url) -> MatchedRoute|False
 *  - url (String): URL to find mathing route for.
 *
 *  Returns first matching route or false if none found.
 *  See [[Route#match]] for details of _MatchData_ object.
 **/
NRouter.prototype.match = function match(url) {
  var routes = this.__routes__.__generic__, found = false;

  // find routes by prefix first
  Common.each(this.__prefix_regexps__, function (re, prefix) {
    if (re.test(url)) {
      routes = this.__routes__[prefix];
      return false; // stop iterator
    }
  }, this);

  // try to find matching route
  Common.each(routes, function (route) {
    var data = route.match(url);
    if (data) {
      found = data;
      return false; // stop iterator
    }
  });

  return found;
};


/**
 *  NRouter#linkTo(name[, params]) -> String|Null
 *  - name (String): Name of the URL (or group of URLs).
 *  - params (Object): Params to feed to URL builder.
 *
 *  Creates pretty URL for the route registered with given `name` and if
 *  [[Route#isValidParams]] of that route is positive.
 *
 *  If there were several routes registered with such `name`, the one that
 *  produce the longest URL is used.
 *
 *
 *  ##### See Also
 *
 *  - [[Route#buildURL]]
 **/
NRouter.prototype.linkTo = function linkTo(name, params) {
  var url = null;

  // find route thet returns longest URL with given params
  Common.each(this.__named_routes__[name], function (route) {
    var tmp;

    // validate params for the route
    if (route.isValidParams(params)) {
      tmp = route.buildURL(params);
      // we want return the longest matching
      if (null === url || url.length < tmp.length) {
        url = tmp;
      }
    }
  });

  return url;
};
