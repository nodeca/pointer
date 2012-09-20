'use strict';


var each = require('../common').each;


////////////////////////////////////////////////////////////////////////////////


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

  each(nodes, function (node) {
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




////////////////////////////////////////////////////////////////////////////////


function Matcher(ast, params) {
  this.__idx__    = 0; // last param index
  this.__params__ = {};

  // prepare basic configuration of params
  each(params, function (cfg, key) {
    var default_val, match_re;

    if ('[object RegExp]' === Object.prototype.toString.call(cfg)) {
      match_re = cfg;
    } else if (cfg !== Object(cfg)) {
      default_val = cfg;
    } else {
      default_val = cfg['default'];
      match_re = cfg['match'];
    }

    this.__params__[key] = define_param(0, false, default_val, match_re);
  }, this);

  this.__regexp__ = new RegExp('^' + build_regexp(this, ast) + '$');
}


//  Matcher#match(url) -> Object|Null
//
//  Returns found params (on match) null otherwise.
//
Matcher.prototype.match = function match(url) {
  var data, captures = String(url).match(this.__regexp__);

  if (captures) {
    data = {};

    // build params hash from capture groups
    each(this.__params__, function (cfg, key) {
      var val = captures[cfg.idx];
      data[key] = ('undefined' === typeof val) ? cfg['default'] : val;
    });

    return data;
  }

  // route not match
  return null;
};


// MODULE EXPORTS //////////////////////////////////////////////////////////////


module.exports = Matcher;
