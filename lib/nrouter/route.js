/** internal
 *  class Route
 **/


'use strict';


var Compiler = require('./route/compiler');
var Builder = require('./route/builder');
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
 *          default: 123
 *        }
 *      }
 **/
var Route = module.exports = function Route(pattern, params, handler) {
  var ast = Compiler.compile(pattern);

  this.__idx__    = 0; // last param index
  this.__params__ = {};

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
  this.__builder__  = new Builder(ast);
  this.__handler__  = handler;
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
  var data, captures = String(url).match(this.__regexp__);

  if (captures) {
    data = {params: {}, handler: this.__handler__};
    Common.each(this.__params__, function (cfg, key) {
      var val = captures[cfg.idx];
      data.params[key] = ('undefined' === typeof val) ? cfg['default'] : val;
    });
    return data;
  }

  return null;
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
  return this.__builder__.build(params);
};
