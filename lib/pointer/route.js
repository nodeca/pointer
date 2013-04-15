/** internal
 *  class Route
 **/


'use strict';


var URLBuilder  = require('./route/url-builder');
var URLMatcher  = require('./route/url-matcher');
var Compiler    = require('./route/compiler');


////////////////////////////////////////////////////////////////////////////////


/**
 *  new Route(pattern[, anchor][, params[, meta[, prefix]]])
 *  - pattern (String): URL pattern. See description below.
 *  - anchor (String): Same as `pattern` but for anchor of URL only.
 *  - params (Object): Params options. Se description below.
 *  - meta (Mixed): Meta vars to be returned as part of MatchData
 *    by [[Route#match]] on successfull matching.
 *  - prefix (String): Mount point prepended to the URL on [[Route#buildURL]].
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
 *  - *match* (Optional, RegExp, Default: [^/]+):
 *    RegExp that param should match
 *
 *  - *default* (Optional, Mixed):
 *    Default value, if param was not presented in the URL upon `match()`
 *    (when it was in the optional group or even not presentes in pattern).
 *
 *  You are free to specify as many `params` options as you want. You also can
 *  specify options of params that are not presented in matching rule, so their
 *  `default` values willl be used when matching route will be found, e.g.:
 *
 *      new Route('/t{thread_id}/last-page.html', {
 *        thread_id: /\d+/,
 *        page: -1
 *      }, my_handler);
 *
 *  Anchor is always optional. It does not affect if the route can be matched or
 *  not. If the second argument is a string - it's an anchor:
 *
 *      new Route('/t{thread_id}/last-page.html', 'post{post_id}', {
 *        thread_id: /\d+/,
 *        post_id: /\d+/,
 *        page: -1
 *      }, my_handler);
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
 *          default: 123
 *        }
 *      }
 **/
function Route(pattern, anchor, params, meta, prefix) {

  // If `anchor` is an object, that means `anchor` is actually skipped, and the
  // given object is for `params`.
  if (null !== anchor && 'object' === typeof anchor) {
    prefix = meta;
    meta = params;
    params = anchor;
    anchor = null;
  }

  this.__base_ast__       = Compiler.compile(pattern);
  this.__base_builder__   = new URLBuilder(this.__base_ast__, params || {});
  this.__base_matcher__   = new URLMatcher(this.__base_ast__, params || {});
  this.__anchor_ast__     = null;
  this.__anchor_builder__ = null;
  this.__anchor_matcher__ = null;
  this.__meta__           = meta;
  this.__prefix__         = String(prefix || '');

  if (anchor) {
    this.__anchor_ast__     = Compiler.compile(anchor);
    this.__anchor_builder__ = new URLBuilder(this.__anchor_ast__, params || {});
    this.__anchor_matcher__ = new URLMatcher(this.__anchor_ast__, params || {});
  }
}


/**
 *  Route#match(url[, anchor]) -> Object|Null
 *  - url (String): URL to match route against without the anchor.
 *  - anchor (String): Anchor part (fragment) of URL to match.
 *
 *  Returns `Object` with matching data (see below) if [[Route]] matches against
 *  given `url` and `anchor`:
 *
 *  - *params* (Object): Params collected from the URL.
 *  - *meta* (Mixed): Meta data associated with route.
 *  - *hasAnchor* (Boolean): true only when anchor was matched/
 **/
Route.prototype.match = function match(url, anchor) {
  var resultParams = this.__base_matcher__.match(url),
      anchorParams,
      param;

  if (!resultParams) {
    return null;
  }

  if (anchor) {
    anchorParams = this.__anchor_matcher__.match(anchor);

    if (anchorParams) {
      for (param in anchorParams) {
        if (Object.prototype.hasOwnProperty.call(anchorParams, param)) {
          resultParams[param] = anchorParams[param];
        }
      }
    }
  }

  return {
    params: resultParams,
    meta: this.__meta__,
    hasAnchor: !!anchorParams
  };
};


/**
 *  Route#buildURL(params) -> String|Null
 *  - params (Object): Params to fill into resulting URL.
 *
 *  Returns URL representation of the route with given params.
 *  Returns `Null` when there were not enough params to build URL.
 **/
Route.prototype.buildURL = function buildURL(params) {
  var url = this.__base_builder__.build(params),
      anchor;

  if (!url) {
    return null;
  }

  if (this.__anchor_builder__) {
    anchor = this.__anchor_builder__.build(params);

    if (anchor) {
      url += '#' + anchor;
    }
  }

  return this.__prefix__ + url;
};


// MODULE EXPORTS //////////////////////////////////////////////////////////////


module.exports = Route;
