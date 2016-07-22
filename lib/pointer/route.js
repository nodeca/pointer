/** internal
 *  class Route
 **/


'use strict';


var URLBuilder  = require('./route/url-builder');
var URLMatcher  = require('./route/url-matcher');
var Compiler    = require('./route/compiler');


////////////////////////////////////////////////////////////////////////////////


/**
 *  new Route(pattern[, params[, meta[, prefix]]])
 *  - pattern (String): URL pattern. See description below.
 *  - params (Object): Params options. Se description below.
 *  - meta (Mixed): Meta vars to be returned as part of MatchData
 *    by [[Route#match]] on successfull matching.
 *  - prefix (Object): Mount point prepended to the URL on [[Route#buildURL]],
 *    parsed as an url.
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
 *  - *type* (Optional, String, Default: 'string'): Set 'integer' to
 *    coerce result to int.
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
 *
 *  Very often you need to get params as integers. Use `type` option to cast:
 *
 *      {
 *        thread_id: {
 *          match: /\d+/
 *          type: 'integer'
 *        }
 *      }
 **/
function Route(pattern, params, meta, prefix, parseURL) {
  this.__ast__      = Compiler.compile(pattern);
  this.__builder__  = new URLBuilder(this.__ast__, params || {});
  this.__matcher__  = new URLMatcher(this.__ast__, params || {});
  this.__meta__     = meta;
  this.__prefix__   = String(prefix || '');

  if (prefix) {
    var parsed = parseURL(this.__prefix__);

    this.__prefix_protocol__ = typeof parsed.protocol === 'string' ?
                               parsed.protocol.replace(/:$/, '') :
                               parsed.protocol;
    this.__prefix_hostname__ = parsed.hostname;
    this.__prefix_port__     = parsed.port;
    this.__prefix_pathname__ = parsed.pathname;
  }
}


/**
 *  Route#match(url) -> Object|Null
 *  - url (String): URL to match route against
 *
 *  Returns `Object` with matching data (see below) if [[Route]] matches against
 *  given `url`:
 *
 *  - *params* (Object): Params collected from the URL.
 *  - *meta* (Mixed): Meta data associated with route.
 **/
Route.prototype.match = function match(url) {
  var params = this.__matcher__.match(url);
  return !params ? null : { params: params, meta: this.__meta__ };
};


/**
 *  Route#buildURL(params[, linkDefaults]) -> String|Null
 *  - params (Object): Params to fill into resulting URL.
 *  - linkDefaults (Object): hash of default values for resulting URL
 *    `protocol`, `hostname`, and `port`.
 *
 *  Returns URL representation of the route with given params.
 *  Returns `Null` when there were not enough params to build URL.
 **/
Route.prototype.buildURL = function buildURL(params, linkDefaults) {
  linkDefaults = linkDefaults || {};

  var prefix   = '',
      // pathname of url - generated from route's pattern
      route    = this.__builder__.build(params),
      protocol = this.__prefix_protocol__ || linkDefaults.protocol,
      hostname = this.__prefix_hostname__ || linkDefaults.hostname,
      port     = this.__prefix_port__     || linkDefaults.port;

  if (route === null) return null; // Can't build.

  if (protocol) prefix += protocol + ':';

  if (protocol || hostname) prefix += '//';

  if (hostname) prefix += hostname;

  if (port) prefix += ':' + port;

  if (this.__prefix_pathname__) prefix += this.__prefix_pathname__;

  return prefix + route;
};


// MODULE EXPORTS //////////////////////////////////////////////////////////////


module.exports = Route;
