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
  throw "Not implemented yet";
};
