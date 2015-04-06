'use strict';


////////////////////////////////////////////////////////////////////////////////


// returns param internal config definition
function define_param(idx, requiredFlag, defaultValue, re, type) {
  return {
    idx:        idx || -1,
    required:   !!requiredFlag,
    'default':  defaultValue,
    match_re:   re || /[^\/]+?/,
    type:       type || 'string'
  };
}

/*eslint-disable consistent-this*/

// builds regexp recursively
function build_regexp(self, nodes) {
  var re = '';

  nodes.forEach(function (node) {

    if (node.type === 'optional') {
      re += '(?:' + build_regexp(self, node.nodes) + ')?';
      return;
    }

    if (node.type === 'string') {
      // make string to regexp-safe
      re += node.string.replace(/([.?*+{}()\[\]])/g, '\\$1');
      return;
    }

    if (node.type === 'param') {

      // initial state of self.__idx__ == 0 (no capture groups)
      // regexp's capture groups starts with 1
      self.__idx__ += 1;

      if (!self.__params__[node.key]) {

        // define param configuration if it was not passed within
        // params options to constructor
        self.__params__[node.key] = define_param(self.__idx__, true);

      } else {

        if (self.__params__[node.key].required) {
          throw new Error('Duplicate parameter name ' + node.key);
        }

        self.__params__[node.key].idx = self.__idx__;
        self.__params__[node.key].required = true;
      }

      re += '(' + self.__params__[node.key].match_re.source + ')';

      return;
    }

    // THIS SHOULD NEVER HAPPEN!!!
    throw new Error('Unknown node type: "' + node.type + '".');
  });

  return re;
}


////////////////////////////////////////////////////////////////////////////////


function Matcher(ast, params) {
  var cfg, default_val, match_re, type;

  this.__idx__    = 0; // last param index
  this.__params__ = {};

  //
  // prepare basic configuration of params
  //

  params = params || {};

  Object.keys(params).forEach(function (key) {
    if (params.hasOwnProperty(key)) {
      default_val = match_re = void 0;

      cfg = params[key];

      if (Object.prototype.toString.call(cfg) === '[object RegExp]') {
        match_re = cfg;
      } else if (cfg !== Object(cfg)) {
        default_val = cfg;
      } else {
        default_val = cfg.default;
        match_re = cfg.match;
        type = cfg.type;
      }

      this.__params__[key] = define_param(0, false, default_val, match_re, type);
    }
  }, this);

  this.__regexp__ = new RegExp('^' + build_regexp(this, ast) + '$');
}


//  Matcher#match(url) -> Object|Null
//
//  Returns found params (on match) null otherwise.
//
Matcher.prototype.match = function match(url) {
  var key, cfg, val, data, captures = String(url).match(this.__regexp__);

  if (captures) {
    data = {};

    // build params hash from capture groups
    for (key in this.__params__) {
      if (this.__params__.hasOwnProperty(key)) {
        cfg = this.__params__[key];
        val = captures[cfg.idx];
        if (typeof val === 'undefined') {
          data[key] = cfg['default'];
        } else {
          data[key] = (cfg.type === 'integer') ? parseInt(val, 10) : val;
        }
      }
    }

    return data;
  }

  // route not match
  return null;
};


// MODULE EXPORTS //////////////////////////////////////////////////////////////


module.exports = Matcher;
