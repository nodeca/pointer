var Pointer = window.Pointer = (function () {
  (function (self) {
    self.def  = function (name, func) {
      self[name] = {exports: {}, called: false, func: func};
    };
    self.req = function (name) {
      if (self[name].called) {
        return self[name].exports;
      }

      self[name].called  = true;
      self[name].exports = self[name].func.call(self[name], self.req);

      return self[name].exports;
    };
  }(this));

  this.def("0", function (require) {
    var module = this, exports = this.exports;

/**
 *  class Pointer
 **/


'use strict';


var Common = require("1");
var Route = require("2");


/**
 *  new Pointer([routes])
 *  - routes (Object): Routes map in form of `pattern: options` pairs.
 *
 *  Creates new instance of router, prefilled with given routes (if provided).
 *
 *
 *  ##### See Also
 *
 *  - [[Pointer#addRoute]]
 **/
var Pointer = module.exports = function Pointer(routes) {
  // all routes grouped by prefixes
  this.__routes__           = {__generic__: []};

  // cache of RegExps for known prefixes
  this.__prefix_regexps__   = {};

  // routes grouped by names (needed for linkTo)
  this.__named_routes__     = {};

  // prefill routes if map provided
  Common.each(routes, function (options, pattern) {
    this.addRoute(pattern, options);
  }, this);
};


/** alias of: Pointer.new
 *  Pointer.create([routes]) -> Pointer
 *
 *  Constructor proxy.
 **/
Pointer.create = function create(routes) {
  return new Pointer(routes);
};


/**
 *  Pointer#addRoute(pattern[, options]) -> Route
 *  - pattern (String): Pattern as for [[Route.new]]
 *  - options (Object): Route options, see below.
 *
 *  Create and add new route.
 *
 *
 *  ##### Options
 *
 *  Second argument of `addRoute` is options. It consist of following keys:
 *
 *  -   *name*    (Optional, String): name of the route.
 *      Used to build URLs with [[Pointer#linkTo]].
 *      Several routes may have same name, see [[Pointer#linkTo]] for
 *      detailed information.
 *
 *  -   *prefix*  (Optional, String): think of it as of mount point.
 *      You can use `prefix()` as well, which is a syntax sugar
 *      that sets this option.
 *
 *  -   *params*  (Optional, Object): options of params in the route.
 *      See [[Route.new]] for details.
 *
 *  -   *meta* (Optional, Mixed): meta data to mix into match object.
 *      See [[Route.new]] for details.
 *
 *
 *  ##### See Also:
 *
 *  - [[Route.new]]
 **/
Pointer.prototype.addRoute = function addRoute(match, options) {
  var route, group = '__generic__';

  // options are optional.
  options = options || {};

  if (options.prefix) {
    group = options.prefix;
    match = options.prefix + match;
  }

  route = new Route(match, options.params || {}, options.meta || {});

  // create new routes container for the group (prefix)
  // and cache prefix regexp
  if (!this.__routes__[group]) {
    this.__routes__[group] = [];
    this.__prefix_regexps__[group] = new RegExp('^' + options.prefix);
  }

  // if name given - push route into named stack for linkTo
  if (options.name) {
    if (!this.__named_routes__[options.name]) {
      this.__named_routes__[options.name] = [];
    }
    this.__named_routes__[options.name].push(route);
  }

  this.__routes__[group].push(route);
  return route;
};


/**
 *  Pointer#match(url) -> MatchedRoute|False
 *  - url (String): URL to find mathing route for.
 *
 *  Returns first matching route or false if none found.
 *  See [[Route#match]] for details of _MatchData_ object.
 **/
Pointer.prototype.match = function match(url) {
  var routes = this.__routes__.__generic__, found = false;

  // find routes by prefix first
  Common.each(this.__prefix_regexps__, function (re, prefix) {
    if (re.test(url)) {
      routes = this.__routes__[prefix];
      return false; // stop iterator
    }
  }, this);

  // try to find matching route
  Common.each(routes, function (route) {
    var data = route.match(url);
    if (data) {
      found = data;
      return false; // stop iterator
    }
  });

  return found;
};


/**
 *  Pointer#linkTo(name[, params]) -> String|Null
 *  - name (String): Name of the URL (or group of URLs).
 *  - params (Object): Params to feed to URL builder.
 *
 *  Creates pretty URL for the route registered with given `name` and if
 *  [[Route#isValidParams]] of that route is positive.
 *
 *  If there were several routes registered with such `name`, the one that
 *  produce the longest URL is used.
 *
 *
 *  ##### See Also
 *
 *  - [[Route#buildURL]]
 **/
Pointer.prototype.linkTo = function linkTo(name, params) {
  var url = null;

  // find route thet returns longest URL with given params
  Common.each(this.__named_routes__[name], function (route) {
    var tmp;

    // validate params for the route
    if (route.isValidParams(params)) {
      tmp = route.buildURL(params);
      // we want return the longest matching
      if (null === url || url.length < tmp.length) {
        url = tmp;
      }
    }
  });

  return url;
};


/**
 *  Pointer.createLinkBuilder(pattern[, params]) -> Function
 *  - pattern (String): Pattern as for [[Route.new]]
 *  - params (Object): Params as for [[Route.new]]
 *
 *  Returns function that can be used to build URL for given `pattern` with
 *  provided `params`.
 *
 *
 *  ##### Builder signature
 *
 *      function builder(params) -> String|Null
 *
 *
 *  ##### Example
 *
 *      var builder = Pointer.createLinkBuilder('/foo/{bar}', {
 *        bar: /[a-z]+/
 *      });
 *
 *      builder();              // -> null
 *      builder({bar: 123});    // -> null
 *      builder({bar: 'abc'});  // -> '/foo/abc'
 **/
Pointer.createLinkBuilder = function createLinkBuilder(pattern, params) {
  var r;

  // proxy to URL builder via detached route
  r = new Route(pattern, params);
  return function (params) {
    return r.buildURL(params || {});
  };
};


    return this.exports;
  });
  this.def("1", function (require) {
    var module = this, exports = this.exports;

'use strict';


var Common = module.exports = {};


// iterates through all object keys-value pairs calling iterator on each one
// example: $$.each(objOrArr, function (val, key) { /* ... */ });
Common.each = function each(obj, iterator, ctx) {
  var key, i, len;

  // skip empty
  if (null === obj || undefined === obj) {
    return;
  }

  ctx = ctx || iterator;
  len = obj.length;

  if (len === undefined) {
    // iterate through objects
    for (key in obj) {
      if (obj.hasOwnProperty(key) && false === iterator.call(ctx, obj[key], key)) {
        return;
      }
    }
  } else {
    // iterate through array
    for (i = 0; i < len; i += 1) {
      if (false === iterator.call(ctx, obj[i], i)) {
        return;
      }
    }
  }
};


    return this.exports;
  });
  this.def("2", function (require) {
    var module = this, exports = this.exports;

/** internal
 *  class Route
 **/


'use strict';


var URLBuilder = require("3");
var Compiler = require("4");
var Common = require("1");


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


    return this.exports;
  });
  this.def("3", function (require) {
    var module = this, exports = this.exports;

'use strict';


var Common = require("1");


// Node builders. Implements same interface as Builder
////////////////////////////////////////////////////////////////////////////////


function StringBuilderNode(node) {
  this.value = node.string;
}


StringBuilderNode.prototype.build = function (/* params */) {
  return this.value;
};


function ParamBuilderNode(node) {
  this.key = node.key;
}


ParamBuilderNode.prototype.build = function (params) {
  return params[this.key];
};


// MODULE EXPORT ///////////////////////////////////////////////////////////////


//  new Builder(ast)
//  - ast (Array): Array of nodes as returned by Compiler
//
//  Creates instance of builder that can render route with given params
//  See [[Builder#build]].
var Builder = module.exports = function Builder(ast) {
  // array of param names found in the AST
  // used to validate params in [[Builder#build]]
  this.__known_params__ = [];

  // stack of node builders / nested builders (for optional groups)
  this.__builders__     = [];

  // process given ast into array of builders
  Common.each(ast,  function (node) {
    if ('string' === node.type) {
      this.__builders__.push(new StringBuilderNode(node));
      return;
    }

    if ('param' === node.type) {
      this.__known_params__.push(node.key);
      this.__builders__.push(new ParamBuilderNode(node));
      return;
    }

    if ('optional' === node.type) {
      // node builders implemets same interface as Builder.
      // we use `build()` method to render node, so we can
      // use nested Builder instances for optional groups
      this.__builders__.push(new Builder(node.nodes));
      return;
    }

    // THIS SHOULD NEVER HAPPEN!!!
    throw new Error('Unknown node type: "' + node.type + '".');
  }, this);
};

//  Builder#build([params]) -> String|Null
//  - parmas (Object): Params to fill route with.
//
//  Returns URL representing route with given params.
Builder.prototype.build = function (params) {
  var url, is_valid = true;

  // make sure we have enough params to build URL
  Common.each(this.__known_params__, function (key) {
    if ('undefined' === typeof params[key]) {
      is_valid = false;
      return false; // stop iterator
    }
  });

  if (!is_valid) {
    // not enough params for this builder
    return null;
  }

  url = '';

  // render and concatenate all parts
  Common.each(this.__builders__, function (builder) {
    // make sure we concatenate Strings
    url += (builder.build(params) || '');
  });

  return url;
};


    return this.exports;
  });
  this.def("4", function (require) {
    var module = this, exports = this.exports;

'use strict';


var AST = require("5");
var Parser = require("6").parser;


// Propose our AST as `yy` variable to JISON
Parser.yy = AST;


// Export compiler
module.exports.compile = function (route) {
  return Parser.parse(route);
};


    return this.exports;
  });
  this.def("5", function (require) {
    var module = this, exports = this.exports;

'use strict';


var AST = module.exports = {};


AST.StringNode = function (string) {
  this.type = 'string';
  this.string = string;
};


AST.ParamNode = function (key) {
  this.type = 'param';
  this.key = key;
};


AST.OptionalGroupNode = function (nodes) {
  this.type = 'optional';
  this.nodes = nodes;
};


    return this.exports;
  });
  this.def("6", function (require) {
    var module = this, exports = this.exports;

/* Jison generated parser */
var pointer = (function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"pattern":3,"route":4,"EOF":5,"parts":6,"part":7,"OPEN_OPTIONAL":8,"CLOSE":9,"OPEN_PARAM":10,"substrings":11,"STRING":12,"$accept":0,"$end":1},
terminals_: {2:"error",5:"EOF",8:"OPEN_OPTIONAL",9:"CLOSE",10:"OPEN_PARAM",12:"STRING"},
productions_: [0,[3,2],[4,1],[4,0],[6,1],[6,2],[7,3],[7,3],[7,1],[11,1],[11,2]],
performAction: function anonymous(yytext,yyleng,yylineno,yy,yystate,$$,_$) {

var $0 = $$.length - 1;
switch (yystate) {
case 1: return $$[$0-1] 
break;
case 2: this.$ = $$[$0]; 
break;
case 3: this.$ = []; 
break;
case 4: this.$ = [$$[$0]]; 
break;
case 5: $$[$0-1].push($$[$0]); this.$ = $$[$0-1]; 
break;
case 6: this.$ = new yy.OptionalGroupNode($$[$0-1]); 
break;
case 7: this.$ = new yy.ParamNode($$[$0-1]); 
break;
case 8: this.$ = new yy.StringNode($$[$0]); 
break;
case 10: this.$ = $$[$0-1] + $$[$0]; 
break;
}
},
table: [{3:1,4:2,5:[2,3],6:3,7:4,8:[1,5],10:[1,6],12:[1,7]},{1:[3]},{5:[1,8]},{5:[2,2],7:9,8:[1,5],9:[2,2],10:[1,6],12:[1,7]},{5:[2,4],8:[2,4],9:[2,4],10:[2,4],12:[2,4]},{4:10,6:3,7:4,8:[1,5],9:[2,3],10:[1,6],12:[1,7]},{11:11,12:[1,12]},{5:[2,8],8:[2,8],9:[2,8],10:[2,8],12:[2,8]},{1:[2,1]},{5:[2,5],8:[2,5],9:[2,5],10:[2,5],12:[2,5]},{9:[1,13]},{9:[1,14],12:[1,15]},{9:[2,9],12:[2,9]},{5:[2,6],8:[2,6],9:[2,6],10:[2,6],12:[2,6]},{5:[2,7],8:[2,7],9:[2,7],10:[2,7],12:[2,7]},{9:[2,10],12:[2,10]}],
defaultActions: {8:[2,1]},
parseError: function parseError(str, hash) {
    throw new Error(str);
},
parse: function parse(input) {
    var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = "", yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    this.yy.parser = this;
    if (typeof this.lexer.yylloc == "undefined")
        this.lexer.yylloc = {};
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);
    var ranges = this.lexer.options && this.lexer.options.ranges;
    if (typeof this.yy.parseError === "function")
        this.parseError = this.yy.parseError;
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    function lex() {
        var token;
        token = self.lexer.lex() || 1;
        if (typeof token !== "number") {
            token = self.symbols_[token] || token;
        }
        return token;
    }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == "undefined") {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
        if (typeof action === "undefined" || !action.length || !action[0]) {
            var errStr = "";
            if (!recovering) {
                expected = [];
                for (p in table[state])
                    if (this.terminals_[p] && p > 2) {
                        expected.push("'" + this.terminals_[p] + "'");
                    }
                if (this.lexer.showPosition) {
                    errStr = "Parse error on line " + (yylineno + 1) + ":\n" + this.lexer.showPosition() + "\nExpecting " + expected.join(", ") + ", got '" + (this.terminals_[symbol] || symbol) + "'";
                } else {
                    errStr = "Parse error on line " + (yylineno + 1) + ": Unexpected " + (symbol == 1?"end of input":"'" + (this.terminals_[symbol] || symbol) + "'");
                }
                this.parseError(errStr, {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
            }
        }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error("Parse Error: multiple actions possible at state: " + state + ", token: " + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(this.lexer.yytext);
            lstack.push(this.lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                if (recovering > 0)
                    recovering--;
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {first_line: lstack[lstack.length - (len || 1)].first_line, last_line: lstack[lstack.length - 1].last_line, first_column: lstack[lstack.length - (len || 1)].first_column, last_column: lstack[lstack.length - 1].last_column};
            if (ranges) {
                yyval._$.range = [lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1]];
            }
            r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
            if (typeof r !== "undefined") {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}
};
/* Jison generated lexer */
var lexer = (function(){
var lexer = ({EOF:1,
parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },
setInput:function (input) {
        this._input = input;
        this._more = this._less = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {first_line:1,first_column:0,last_line:1,last_column:0};
        if (this.options.ranges) this.yylloc.range = [0,0];
        this.offset = 0;
        return this;
    },
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) this.yylloc.range[1]++;

        this._input = this._input.slice(1);
        return ch;
    },
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length-len-1);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length-1);
        this.matched = this.matched.substr(0, this.matched.length-1);

        if (lines.length-1) this.yylineno -= lines.length-1;
        var r = this.yylloc.range;

        this.yylloc = {first_line: this.yylloc.first_line,
          last_line: this.yylineno+1,
          first_column: this.yylloc.first_column,
          last_column: lines ?
              (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length:
              this.yylloc.first_column - len
          };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        return this;
    },
more:function () {
        this._more = true;
        return this;
    },
less:function (n) {
        this.unput(this.match.slice(n));
    },
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20)+(next.length > 20 ? '...':'')).replace(/\n/g, "");
    },
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c+"^";
    },
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) this.done = true;

        var token,
            match,
            tempMatch,
            index,
            col,
            lines;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i=0;i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (!this.options.flex) break;
            }
        }
        if (match) {
            lines = match[0].match(/(?:\r\n?|\n).*/g);
            if (lines) this.yylineno += lines.length;
            this.yylloc = {first_line: this.yylloc.last_line,
                           last_line: this.yylineno+1,
                           first_column: this.yylloc.last_column,
                           last_column: lines ? lines[lines.length-1].length-lines[lines.length-1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length};
            this.yytext += match[0];
            this.match += match[0];
            this.matches = match;
            this.yyleng = this.yytext.length;
            if (this.options.ranges) {
                this.yylloc.range = [this.offset, this.offset += this.yyleng];
            }
            this._more = false;
            this._input = this._input.slice(match[0].length);
            this.matched += match[0];
            token = this.performAction.call(this, this.yy, this, rules[index],this.conditionStack[this.conditionStack.length-1]);
            if (this.done && this._input) this.done = false;
            if (token) return token;
            else return;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line '+(this.yylineno+1)+'. Unrecognized text.\n'+this.showPosition(),
                    {text: "", token: null, line: this.yylineno});
        }
    },
lex:function lex() {
        var r = this.next();
        if (typeof r !== 'undefined') {
            return r;
        } else {
            return this.lex();
        }
    },
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },
popState:function popState() {
        return this.conditionStack.pop();
    },
_currentRules:function _currentRules() {
        return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules;
    },
topState:function () {
        return this.conditionStack[this.conditionStack.length-2];
    },
pushState:function begin(condition) {
        this.begin(condition);
    }});
lexer.options = {};
lexer.performAction = function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {

var YYSTATE=YY_START
switch($avoiding_name_collisions) {
case 0: this.begin("escape"); 
break;
case 1: this.popState(); return "STRING"; 
break;
case 2: return "STRING"; 
break;
case 3: return "STRING"; 
break;
case 4: this.begin("param"); return "OPEN_PARAM"; 
break;
case 5: this.begin("optional"); return "OPEN_OPTIONAL"; 
break;
case 6: this.popState(); return "CLOSE"; 
break;
case 7: this.popState(); return "CLOSE"; 
break;
case 8: return "STRING"; 
break;
case 9: return 5; 
break;
}
};
lexer.rules = [/^(?:\\(?=[{}()]))/,/^(?:[{}()])/,/^(?:\\(?![{}()]))/,/^(?:[^{}()\\]+)/,/^(?:\{)/,/^(?:\()/,/^(?:\})/,/^(?:\))/,/^(?:\}|\))/,/^(?:$)/];
lexer.conditions = {"escape":{"rules":[0,1,2,3,4,5],"inclusive":false},"param":{"rules":[0,2,3,4,5,6],"inclusive":false},"optional":{"rules":[0,2,3,4,5,7,9],"inclusive":false},"INITIAL":{"rules":[0,2,3,4,5,8,9],"inclusive":true}};
return lexer;})()
parser.lexer = lexer;function Parser () { this.yy = {}; }Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();
if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = pointer;
exports.Parser = pointer.Parser;
exports.parse = function () { return pointer.parse.apply(pointer, arguments); }
exports.main = function commonjsMain(args) {
    if (!args[1])
        throw new Error('Usage: '+args[0]+' FILE');
    var source, cwd;
    if (typeof process !== 'undefined') {
        source = require('fs').readFileSync(require('path').resolve(args[1]), "utf8");
    } else {
        source = require("file").path(require("file").cwd()).join(args[1]).read({charset: "utf-8"});
    }
    return exports.parser.parse(source);
}
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(typeof process !== 'undefined' ? process.argv.slice(1) : require("system").args);
}
}

    return this.exports;
  });

  return this.req("0");
}.call({}));
