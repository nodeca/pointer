/**
 *  class NRouter
 **/


'use strict';



/**
 *  new NRouter()
 **/
var NRouter = module.exports = function NRouter() {
  throw "Not implemented yet";
};


/** alias of: NRouter.new
 *  NRouter.create()
 **/
NRouter.create = function create() {
  throw "Not implemented yet";
};


/**
 *  NRouter#addRoute(pattern[, options], handler) -> Route
 *  - pattern (String):
 *  - options (Object):
 *  - handler (Function):
 *
 *  Create and add new route.
 *
 *
 *  ##### See Also:
 *
 *  - [[Route#new]]
 **/
NRouter.prototype.addRoute = function addRoute(match, params, handler) {
  throw "Not implemented yet";
};


/**
 *  NRouter#match(url) -> Route|Null
 *
 *  Return first matching route or flse if none found.
 **/
NRouter.prototype.match = function match(url) {
  throw "Not implemented yet";
};


/**
 *  NRouter#prefix(group, block) -> Void
 *  - group (String):
 *  - block (Function):
 *
 *
 *  ##### Example
 *
 *      router.prefix('/foobar', function (router) {
 *        router.addRoute('/baz', {}, myhandler);
 *      });
 *
 *      // equals to:
 *
 *      router.addRoute('/baz', {prefix: '/foobar'}, myhandler);
 **/
NRouter.prototype.prefix = function prefix(group, block) {
  throw "Not implemented yet";
};
