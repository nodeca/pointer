/** internal
 *  class Route
 **/


'use strict';


var URLBuilder = require('./route/url-builder');
var Compiler = require('./route/compiler');
var Common = require('./common');


// jshint workaround
var toObject = Object;


// returns param internal config definition
function define_param(idx, requiredFlag, defaultValue, re) {
  return {
    "idx":      idx || -1,
    "required": !!requiredFlag,
    "default":  defaultValue,
    "match_re": re || /[^\/]+?/
  };
}


// builds regexp recursively
function build_regexp(self, nodes) {
  var re = '';

  Common.each(nodes, function (node) {
    if ('string' === node.type) {
      // convert string to regexp-safe
      re += node.string.replace(/([.?*+{}()\[\]])/g, '\\$1');
      return;
    }

    if ('param' === node.type) {
      // initial state of self.__idx__ == 0 (no capture groups)
      // regexp's capture groups starts with 1
      self.__idx__ += 1;

      if (!self.__params__[node.key]) {
        // define param configuration if it was not passed within
        // params options to constructor
        self.__params__[node.key] = define_param(self.__idx__, true);
      } else {
        // FIXME: Throw an error on duplicate pattern param?
        self.__params__[node.key].idx = self.__idx__;
        self.__params__[node.key].required = true;
      }

      re += '(' + self.__params__[node.key].match_re.source + ')';
      return;
    }

    if ('optional' === node.type) {
      re += '(?:' + build_regexp(self, node.nodes) + ')?';
      return;
    }

    // THIS SHOULD NEVER HAPPEN!!!
    throw new Error('Unknown node type: "' + node.type + '".');
  });

  return re;
}


/**
 *  new Route(pattern[, params[, meta]])
 *  - pattern (String): URL pattern. See description below.
 *  - params (Object): Params options. Se description below.
 *  - meta (Mixed): Meta vars to be returned as part of MatchData
 *    by [[Route#match]] on successfull matching.
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
var Route = module.exports = function Route(pattern, params, meta) {
  var ast = Compiler.compile(pattern);

  this.__idx__    = 0; // last param index
  this.__params__ = {};

  // prepare basic configuration of params
  Common.each(params, function (cfg, key) {
    var default_val, match_re;

    if ('[object RegExp]' === Object.prototype.toString.call(cfg)) {
      match_re = cfg;
    } else if (cfg !== toObject(cfg)) {
      default_val = cfg;
    } else {
      default_val = cfg['default'];
      match_re = cfg['match'];
    }

    this.__params__[key] = define_param(0, false, default_val, match_re);
  }, this);

  this.__regexp__   = new RegExp('^' + build_regexp(this, ast) + '$');
  this.__builder__  = new URLBuilder(ast);
  this.__meta__     = meta;
};


/**
 *  Route#match(url) -> Object|Null
 *  - url (String): URL to match route against
 *
 *  Returns _MatchData_ (see below) if [[Route]] matches against given `url`.
 *
 *
 *  ##### MatchedRoute
 *
 *  MatchedRoute is a structure similar to the one returned by [[Route#match]]
 *  but it also contains matched route instance as well:
 *
 *  - *route* ([[Route]]): Route self-reference.
 *  - *params* (Object): Params collected from the URL.
 *  - *meta* (Mixed): Meta data associated with route.
 **/
Route.prototype.match = function match(url) {
  var data, captures = String(url).match(this.__regexp__);

  if (captures) {
    data = {route: this, params: {}, meta: this.__meta__};

    // build params hash from capture groups
    Common.each(this.__params__, function (cfg, key) {
      var val = captures[cfg.idx];
      data.params[key] = ('undefined' === typeof val) ? cfg['default'] : val;
    });

    return data;
  }

  // route not match
  return null;
};


/**
 *  Route#isValidParams(params) -> Boolean
 *  - params (Object): Params to validate.
 *
 *  Tells whenever given `params` object is valid for route or not.
 **/
Route.prototype.isValidParams = function isValidParams(params) {
  var is_valid = true;

  // make sure params is an object
  params = params || {};

  // verify that given params contains all keys of pattern
  // and that they match associated regexp matchers
  Common.each(this.__params__, function (cfg, key) {
    if (cfg.required &&
        ('undefined' === typeof params[key] ||
         !cfg.match_re.test(params[key]))) {
      is_valid = false;
      return false;
    }
  });

  return is_valid;
};


/**
 *  Route#buildURL(params) -> String|Null
 *  - params (Object): Params to fill into resulting URL.
 *
 *  Returns URL representation of the route with given params.
 *  Returns `Null` when there were not enough params to build URL.
 **/
Route.prototype.buildURL = function buildURL(params) {
  return this.__builder__.build(params);
};
