/** internal
 *  class Route
 **/


'use strict';


var URLBuilder  = require('./route/url-builder');
var URLMatcher  = require('./route/url-matcher');
var Compiler    = require('./route/compiler');


////////////////////////////////////////////////////////////////////////////////


/**
 *  new Route(pattern[, options])
 *  - pattern (String): URL pattern. See description below.
 *  - options (Object): Route options, see below.
 *
 *  Route constructor.
 *
 *
 *  ##### Options
 *
 *  -   *params* (Object): Params options. See description below.
 *
 *  -   *anchor* (String): Same as `pattern` but for anchor of URL only.
 *
 *  -   *anchorParams* (Object): Anchor-specific params options.
 *      Same as `params`.
 *
 *  -   *meta* (Mixed): Meta vars to be returned as part of MatchData
 *      by [[Route#match]] on successfull matching.
 *
 *  -   *prefix* (String): Mount point prepended to the URL on
 *      [[Route#buildURL]].
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
 *        params: {
 *          thread_id: /\d+/,
 *          page: -1
 *        },
 *        meta: my_handler
 *      });
 *
 *  Anchor is always optional. It does not affect if the route can be matched or
 *  not.
 *
 *      new Route('/page.html', {
 *        anchor: 'article{article_id}',
 *        anchorParams: {
 *          article_id: /\d+/
 *        },
 *        meta: my_handler
 *      });
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
function Route(pattern, options) {
  options = options || {};

  this.__base_ast__       = Compiler.compile(pattern);
  this.__base_builder__   = new URLBuilder(this.__base_ast__, options.params || {});
  this.__base_matcher__   = new URLMatcher(this.__base_ast__, options.params || {});
  this.__anchor_ast__     = null;
  this.__anchor_builder__ = null;
  this.__anchor_matcher__ = null;
  this.__meta__           = options.meta;
  this.__prefix__         = String(options.prefix || '');

  if (options.anchor) {
    this.__anchor_ast__     = Compiler.compile(options.anchor);
    this.__anchor_builder__ = new URLBuilder(this.__anchor_ast__, options.anchorParams || {});
    this.__anchor_matcher__ = new URLMatcher(this.__anchor_ast__, options.anchorParams || {});
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
 *  - *params* (Object): Params collected from the URL's base
 *    (i.e. without anchor).
 *  - *anchorParams* (Object|Null): Params collected from the URL's anchor.
 *    Null if anchor is not matched.
 *  - *meta* (Mixed): Meta data associated with route.
 **/
Route.prototype.match = function match(url, anchor) {
  var baseParams   = this.__base_matcher__.match(url),
      anchorParams = null;

  if (!baseParams) {
    return null;
  }

  if (anchor && this.__anchor_matcher__) {
    anchorParams = this.__anchor_matcher__.match(anchor);
  }

  return {
    meta:         this.__meta__,
    params:       baseParams,
    anchorParams: anchorParams
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
