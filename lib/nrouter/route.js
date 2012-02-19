/** internal
 *  class Route
 **/


'use strict';


var Compiler = require('./route/compiler');


/**
 *  new Route(pattern[, params], handler)
 *  - pattern (String):
 *  - params (Object):
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
 *  ##### Params
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
 *      new Route('/t{thread_id}/last-page.html', {
 *        thread_id: /\d+/,
 *        page: -1
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
  var compiled = Compiler.compile(pattern);
  console.dir(compiled);
  throw "Not implemented yet";
};


/**
 *  Route#match(url) -> Object|Null
 *  - url (String):
 *
 *  Returns _MatchData_ (see below) if [[Route]] matches given `url`,
 *  `Null` otherwise.
 *
 *
 *  ##### MatchData
 *
 *  - *params*  (Object)
 *  - *handler* (Function)
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
