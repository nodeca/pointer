/** internal
 *  class Route
 **/


'use strict';


var Compiler = require('./route/compiler');
var Common = require('./common');


function walk_optional_nodes(self, optGrpNode, params) {
  self.__regexp_src__ += '(?:';

  Common.each(optGrpNode.nodes, function (node) {
    if ('string' === node.type) {
      self.__regexp_src__ += node.string;
      return;
    }

    if ('param' === node.type) {
      self.__regexp_src__ += '(' + (params[node.key] || '[^/]+?') + '){1}';
      self.__params_map__[node.key] = self.__params_idx__;
      self.__params_idx__ += 1;
      return;
    }

    if ('optional' === node.type) {
      walk_optional_nodes(self, node, params);
      return;
    }

    // THIS SHOULD NEVER HAPPEN!!!
    throw new Error('Unknown node type: "' + node.type + '".');
  });

  self.__regexp_src__ += '){0,1}';
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
 *          defult: 123
 *        }
 *      }
 **/
var Route = module.exports = function Route(pattern, options, handler) {
  var self = this, params;

  this.__regexp_src__ = '';
  this.__params_idx__ = 1;
  this.__params_map__ = {};
  this.__handler__    = handler;

  options = options || {};
  params = options.params || {};

  Common.each(Compiler.compile(pattern), function (node) {
    if ('string' === node.type) {
      self.__regexp_src__ += node.string;
      return;
    }

    if ('param' === node.type) {
      self.__regexp_src__ += '(' + (params[node.key] || '[^/]+?') + '){1}';
      self.__params_map__[node.key] = self.__params_idx__;
      self.__params_idx__ += 1;
      return;
    }

    if ('optional' === node.type) {
      walk_optional_nodes(self, node, params);
      return;
    }

    // THIS SHOULD NEVER HAPPEN!!!
    throw new Error('Unknown node type: "' + node.type + '".');
  });

  this.__regexp__ = new RegExp('^' + this.__regexp_src__ + '$');
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
    Common.each(this.__params_map__, function (idx, key) {
      data.params[key] = captures[idx];
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
  throw "Not implemented yet";
};
