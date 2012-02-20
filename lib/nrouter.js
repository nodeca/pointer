/**
 *  class NRouter
 **/


'use strict';


var Common = require('./nrouter/common');
var Route = require('./nrouter/route');


/**
 *  new NRouter(routes)
 **/
var NRouter = module.exports = function NRouter(routes) {
  this.__routes__ = {__generic__: []};
  this.__prefix_regexps__ = {};
  this.__named_routes__ = {};

  Common.each(routes, function (options, pattern) {
    this.addRoute(pattern, options);
  }, this);
};


/** alias of: NRouter.new
 *  NRouter.create(routes)
 **/
NRouter.create = function create(routes) {
  return new NRouter(routes);
};


/**
 *  NRouter#addRoute(pattern, options) -> Route
 *  - pattern (String):
 *  - options (Object):
 *
 *  Create and add new route.
 *
 *
 *  ##### Options
 *
 *  Second argument of `addRoute` is options. It consist of following keys:
 *
 *  -   *name*    (Optional, String): name of the route.
 *                Used to build URLs with [[NRouter#linkTo]].
 *                Several routes may have same name, see [[NRouter#linkTo]] for
 *                detailed information.
 *  -   *prefix*  (Optional, String): think of it as of mount point.
 *                You can use `prefix()` as well, which is a syntax sugar
 *                that sets this option.
 *  -   *params*  (Optional, Object): options of params in the route.
 *                See [[Route#new]] for details.
 *
 *  -   *handler* (Function): Function that sould be returned upon route match.
 *
 *
 *  ##### See Also:
 *
 *  - [[Route#new]]
 **/
NRouter.prototype.addRoute = function addRoute(match, options) {
  var route, prefix = '__generic__';

  if (options.prefix) {
    prefix = options.prefix;
    match = options.prefix + match;
  }

  route = new Route(match, options.params, options.handler);

  if (!this.__routes__[prefix]) {
    this.__routes__[prefix] = [];
    this.__prefix_regexps__[prefix] = new RegExp('^' + prefix);
  }

  if (options.name) {
    if (!this.__named_routes__[options.name]) {
      this.__named_routes__[options.name] = [];
    }
    this.__named_routes__[options.name].push(route);
  }

  this.__routes__[prefix].push(route);
  return route;
};


/**
 *  NRouter#match(url) -> MatchedRoute|false
 *
 *  Return first matching route or false if none found.
 *
 *
 *  ##### MatchedRoute
 *
 *  MatchedRoute is a structure similar to the one returned by [[Route#match]]
 *  but it also contains matched route instance as well:
 *
 *  - *route* ([[Route]])
 *  - *params* (Object)
 *  - *handler* (Function)
 **/
NRouter.prototype.match = function match(url) {
  var routes = this.__routes__.__generic__, found = false;

  Common.each(this.__prefix_regexps__, function (re, prefix) {
    if (re.test(url)) {
      routes = this.__routes__[prefix];
      return false; // stop iterator
    }
  }, this);

  Common.each(routes, function (route) {
    var data = route.match(url);
    if (data) {
      data.route = route;
      found = data;
      return false;
    }
  });

  return found;
};


/**
 *  NRouter#linkTo(name, params) -> String|Null
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

  Common.each(this.__named_routes__[name], function (route) {
    var tmp;

    if (route.isValidParams(params)) {
      tmp = route.buildURL(params);
      if (null === url || url.length < tmp.length) {
        url = tmp;
      }
    }
  });

  return url;
};
