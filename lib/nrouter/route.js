/**
 *  class Route
 **/


'use strict';


/**
 *  new Route(pattern[, options], handler)
 *  - pattern (String):
 *  - options (Object):
 *  - handler (Function):
 *
 *  Route constructor.
 *
 *
 *  ##### Pattern
 *
 *  Pattern can be a simple string:
 *
 *      pattern: /my/very/simple/route
 *      regexp:  #/my/very/simple/route#
 *
 *  Or string with some parameter (surrounded with `{}`) substitutions:
 *
 *      pattern: /my/route/with/{some}/param
 *      regexp:  #/my/route/with/(?<some>[^/]+)/param#
 *
 *  Also it can have optional (surrounded with `()`) part:
 *
 *      pattern: /my/route/with(/optional)/part
 *      regexp:  #/my/route/with(?:/optional)?/part#
 *
 *  You may have as many params and optional groups as you want.
 *  You can even nest them:
 *
 *      pattern: /my/{kind_of}(-router)(.{format})
 *      regexp:  #/my/(?<kind_of>[^/]+)(?:-router)?(?:[.](?<format>[^/]+))?#
 *
 *
 *  ##### Options
 *
 *  Second argument of `addRoute` is options. It consist of following keys:
 *
 *  -   *name*    (Optional, String): name of the route.
 *                Used to build URLs with `linkTo()`.
 *  -   *prefix*  (Optional, String): think of it as of mount point.
 *                You can use `prefix()` as well, which is a syntax sugar
 *                that sets this option.
 *  -   *params*  (Optional, Object): options of params in the route.
 *                See description below.
 *
 *  ##### Options - Params
 *
 *  Params are given in form of `param_name -> param_options` pairs. Options might
 *  be an Object (see Syntax Sugar below) or RegExp (shorthand for `{match: ...}`).
 *
 *  -   *match*   (Optional, RegExp, Default: [^/]+): RegExp that param should match
 *  -   *default* (Optional, Mixed): Default value, if param was not presented in
 *                the URL upon `match()` (when it was in the optional group).
 *
 *  You are free to specify as many `params` options as you want. You also can
 *  specify options of params that are not presented in matching rule, so their
 *  `default` values willl be used when matching route will be found, e.g.:
 *
 *      router.addRoute('/t{thread_id}/last-page.html', {
 *        params: {
 *          thread_id: /\d+/,
 *          page: -1
 *        }
 *      }, forum.thread.list);
 *
 *  You may specify param options as RegExp, in this case it will be equal to
 *  specifying only `match` option, these are equal:
 *
 *      {
 *        thread_id: /\d+/
 *      }
 *
 *      // shorthand syntax for:
 *
 *      {
 *        thread_id: {
 *          match: /\d+/
 *        }
 *      }
 *
 *  Also you can specify param options as `String` or `Integer`, in this case it
 *  will be equal to specifying `default` option only:
 *
 *      {
 *        page: 123
 *      }
 *
 *      // shorthand syntax for:
 *
 *      {
 *        page: {
 *          defult: 123
 *        }
 *      }
 **/
var Route = module.exports = function Route(pattern, options, handler) {
  throw "Not implemented yet";
};


/**
 *  Route#match(url) -> Route.MatchData|Null
 *  - url (String):
 **/
Route.prototype.match = function match(url) {
  throw "Not implemented yet";
};


/**
 *  Route#isValidParams(params) -> Boolean
 **/
Route.prototype.isValidParams = function isValidParams(params) {
  throw "Not implemented yet";
};


/**
 *  Route#buildURL(params) -> String
 **/
Route.prototype.buildURL = function buildURL(params) {
  throw "Not implemented yet";
};
