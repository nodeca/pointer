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


var Route         = require("1");
var Group         = require("2");
var URL           = require("3");
var find          = require("4").find;
var getSortedKeys = require("4").getSortedKeys;


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
function Pointer(routes) {
  var k;

  // all routes grouped by prefixes (mount points, see addRoute):
  //
  //    https://example.com/foobar
  //      -> { proto: 'https', host: 'example.com', path: '/foobar' }
  //
  //    https://example.com
  //      -> { proto: 'https', host: 'example.com', path: '' }
  //
  //    //example.com
  //      -> { proto: '*', host: 'example.com', path: '' }
  //
  //    /foobar
  //      -> { proto: '*', host: '*', path: '/foobar' }
  //
  //  {
  //    'example.com': { // host
  //      'https': { // proto
  //        groups: {
  //          '': { // path
  //            re: null,
  //            routes: Group(Route(), ...)
  //          }
  //        },
  //        cachedGroupsKeys: [ '' ]
  //      },
  //      '*': {
  //        groups: {
  //          '': {
  //            re: null,
  //            routes: Group(Route(), ...)
  //          },
  //          '/admin': {
  //            re: /^\/admin/,
  //            routes: Group(Route(), ...)
  //          }
  //        },
  //        cachedGroupsKeys: [ '/admin', '' ]
  //      }
  //    }
  //  }
  //
  this.__routes__ = {};

  // routes grouped by names (needed for linkTo)
  this.__named_routes__ = {};

  // prefill routes if map provided
  if (routes) {
    for (k in routes) {
      if (routes.hasOwnProperty(k)) {
        this.addRoute(k, routes[k]);
      }
    }
  }
}


/** alias of: Pointer.new
 *  Pointer.create([routes]) -> Pointer
 *
 *  Constructor proxy.
 **/
Pointer.create = function create(routes) {
  return new Pointer(routes);
};


// helper to parse URL into proto, host and path respecting our internal
// structures, so that proto|path is `*` if it's not provided.
//
function getURLParts(url) {
  var parsed = URL(url);

  return {
    proto:  parsed.attr('protocol') || '*',
    host:   parsed.attr('host') || '*',
    path:   parsed.attr('relative') || ''
  };
}


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
Pointer.prototype.addRoute = function addRoute(pattern, options) {
  var route,
      prefix  = getURLParts(options.prefix || ''),
      host    = prefix.host,
      proto   = prefix.proto,
      path    = prefix.path,
      store   = this.__routes__;

  options = options || {};
  route   = new Route(pattern, options.params, options.meta, options.prefix);

  //
  // save named route for linkTo
  //

  if (options.name) {
    if (!this.__named_routes__[options.name]) {
      this.__named_routes__[options.name] = [];
    }

    this.__named_routes__[options.name].push(route);
  }

  //
  // save route under corresponding host/port
  //

  if (!store[host]) {
    store[host] = {};
  }

  if (!store[host][proto]) {
    store[host][proto] = { groups: {} };
  }

  if (!store[host][proto].groups[path]) {
    store[host][proto].groups[path] = {
      re:     prefix.path ? new RegExp('^' + prefix.path) : null,
      routes: new Group()
    };

    // rebuild groups keys cache
    store[host][proto].cachedGroupsKeys = getSortedKeys(store[host][proto].groups);
  }

  store[host][proto].groups[path].routes.push(route);

  return route;
};


/**
 *  Pointer#match(url) -> Object|Null
 *  - url (String): URL to find mathing route for.
 *
 *  Returns first matching route or false if none found.
 *  See [[Route#match]] for details of matched data Object.
 **/
Pointer.prototype.match = function match(url) {
  var self = this, data = getURLParts(url);

  // if hostname is given, try it first, and then fallback to '*', e.g.:
  //
  // for 'http://example.com/foobar', try 'example.com' and then '*'
  // for '/foobar', try '*' only
  var host_variants = ('*' === data.host) ? [ '*' ] : [ data.host, '*' ];

  // if protocol is given, try it first, and then then fallback to '*', e.g.:
  //
  // for 'http://example.com/foobar', try 'http' and then '*'
  // for '//example.com/foobar' and '/foobar', try '*' only
  var proto_variants = ('*' === data.proto) ? [ '*' ] : [ data.proto, '*' ];

  // scan hosts
  return find(host_variants, function (host) {
    if (!self.__routes__[host]) {
      return;
    }

    // scan protocols
    return find(proto_variants, function (proto) {
      var store = self.__routes__[host][proto];

      if (!store) {
        return;
      }

      // scan paths
      return find(store.cachedGroupsKeys, function (prefix) {
        var group = store.groups[prefix], path = data.path;

        // prefix can be a regexp of path or null
        if (null !== group.re) {
          path = path.replace(group.re, '');

          // prefix regexp removed nothing - that means it does not match path
          if (path === data.path) {
            return;
          }
        }

        // scan routes
        return group.routes.match(path);
      });
    });
  }) || null;
};


/**
 *  Pointer#linkTo(name[, params]) -> String|Null
 *  - name (String): Name of the URL (or group of URLs).
 *  - params (Object): Params to feed to URL builder.
 *
 *  Creates pretty URL for the route registered with given `name`.
 *  If there were several routes registered with such `name`, the one that
 *  produce the longest URL is used.
 *
 *
 *  ##### See Also
 *
 *  - [[Route#buildURL]]
 **/
Pointer.prototype.linkTo = function linkTo(name, params) {
  return find(this.__named_routes__[name] || [], function (route) {
    return route.buildURL(params);
  }) || null;
};


/**
 *  Pointer.parseURL(url) -> Object
 *  - url (String): URL to parse
 *
 *  Returns parts of parsed URL:
 *
 *  - `protocol`: eg. `http`, `https`, `file`, etc.
 *  - `host`: eg. `www.mydomain.com`, `localhost`, etc.
 *  - `port`: eg. `80`
 *  - `path`: the path to the file (eg. `/folder/dir/index.html`)
 *  - `query`: the entire querystring, eg. `item=value&item2=value2`
 *  - `anchor`: the entire string after the `#` symbol
 **/
Pointer.parseURL = function parseURL(url) {
  var o = URL(url);

  return {
    protocol: o.attr('protocol'),
    host:     o.attr('host'),
    port:     o.attr('port'),
    path:     o.attr('path'),
    query:    o.attr('query'),
    anchor:   o.attr('fragment')
  };
};


// MODULE EXPORTS //////////////////////////////////////////////////////////////


module.exports = Pointer;


    return this.exports;
  });
  this.def("1", function (require) {
    var module = this, exports = this.exports;

    /** internal
 *  class Route
 **/


'use strict';


var URLBuilder  = require("5");
var URLMatcher  = require("6");
var Compiler    = require("7");


////////////////////////////////////////////////////////////////////////////////


/**
 *  new Route(pattern[, params[, meta[, prefix]]])
 *  - pattern (String): URL pattern. See description below.
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
function Route(pattern, params, meta, prefix) {
  this.__ast__      = Compiler.compile(pattern);
  this.__builder__  = new URLBuilder(this.__ast__, params);
  this.__matcher__  = new URLMatcher(this.__ast__, params);
  this.__meta__     = meta;
  this.__prefix__   = String(prefix || '');
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
 *  Route#buildURL(params) -> String|Null
 *  - params (Object): Params to fill into resulting URL.
 *
 *  Returns URL representation of the route with given params.
 *  Returns `Null` when there were not enough params to build URL.
 **/
Route.prototype.buildURL = function buildURL(params) {
  var url = this.__builder__.build(params);
  return !url ? null : (this.__prefix__ + url);
};


// MODULE EXPORTS //////////////////////////////////////////////////////////////


module.exports = Route;


    return this.exports;
  });
  this.def("5", function (require) {
    var module = this, exports = this.exports;

    'use strict';


// Node builders. Implements same interface as Builder
////////////////////////////////////////////////////////////////////////////////


function StringBuilderNode(node) {
  this.val = node.string;
}


StringBuilderNode.prototype.build = function (/* params */) {
  return this.val;
};


function ParamBuilderNode(node) {
  this.key = node.key;
}


ParamBuilderNode.prototype.build = function (params) {
  return params[this.key];
};


function is_regexp(obj) {
  return '[object RegExp]' === Object.prototype.toString.call(obj);
}


function get_value(params, key) {
  var options = params[key];

  if (options && options['default']) {
    return options['default'];
  }

  if (!is_regexp(options)) {
    return options;
  }

  return;
}


//  new Builder(ast)
//  - ast (Array): Array of nodes as returned by Compiler
//
//  Creates instance of builder that can render route with given params
//  See [[Builder#build]].
function Builder(ast, params) {
  var i, l, node;

  // array of param names found in the AST
  // used to validate params in [[Builder#build]]
  this.__known_params__ = [];

  // stack of node builders / nested builders (for optional groups)
  this.__builders__     = [];

  // make sure params is an object
  params = params || {};

  // process given ast into array of builders
  for (i = 0, l = ast.length; i < l; i++) {
    node = ast[i];

    if ('optional' === node.type) {
      // node builders implemets same interface as Builder.
      // we use `build()` method to render node, so we can
      // use nested Builder instances for optional groups
      this.__builders__.push(new Builder(node.nodes, params));
    } else if ('string' === node.type) {
      this.__builders__.push(new StringBuilderNode(node));
    } else if ('param' === node.type) {
      this.__known_params__.push({
        key: node.key,
        val: get_value(params, node.key)
      });
      this.__builders__.push(new ParamBuilderNode(node));
    } else {
      // THIS SHOULD NEVER HAPPEN!!!
      throw new Error('Unknown node type: "' + node.type + '".');
    }
  }
}

//  Builder#build([params]) -> String|Null
//  - parmas (Object): Params to fill route with.
//
//  Returns URL representing route with given params.
Builder.prototype.build = function (params) {
  var i, l, obj, val, url;

  // make sure we have enough params to build URL
  for (i = 0, l = this.__known_params__.length; i < l; i++) {
    obj = this.__known_params__[i];
    val = params[obj.key];

    if ('undefined' === typeof val || (obj.val && val === obj.val)) {
      return null;
    }
  }

  url = '';

  // render and concatenate all parts
  for (i = 0, l = this.__builders__.length; i < l; i++) {
    url += this.__builders__[i].build(params) || '';
  }

  return url;
};


// MODULE EXPORTS //////////////////////////////////////////////////////////////


module.exports = Builder;


    return this.exports;
  });
  this.def("6", function (require) {
    var module = this, exports = this.exports;

    'use strict';


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
  var i, l, node, re = '';

  for (i = 0, l = nodes.length; i < l; i++) {
    node = nodes[i];

    if ('optional' === node.type) {
      re += '(?:' + build_regexp(self, node.nodes) + ')?';
    } else if ('string' === node.type) {
      // make string to regexp-safe
      re += node.string.replace(/([.?*+{}()\[\]])/g, '\\$1');
    } else if ('param' === node.type) {
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
    } else {
      // THIS SHOULD NEVER HAPPEN!!!
      throw new Error('Unknown node type: "' + node.type + '".');
    }
  }

  return re;
}


////////////////////////////////////////////////////////////////////////////////


function Matcher(ast, params) {
  var key, cfg, default_val, match_re;

  this.__idx__    = 0; // last param index
  this.__params__ = {};

  //
  // prepare basic configuration of params
  //

  params = params || {};

  for (key in params) {
    if (params.hasOwnProperty(key)) {
      default_val = match_re = void(0);

      cfg = params[key];

      if ('[object RegExp]' === Object.prototype.toString.call(cfg)) {
        match_re = cfg;
      } else if (cfg !== Object(cfg)) {
        default_val = cfg;
      } else {
        default_val = cfg['default'];
        match_re = cfg['match'];
      }

      this.__params__[key] = define_param(0, false, default_val, match_re);
    }
  }

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
        data[key] = ('undefined' === typeof val) ? cfg['default'] : val;
      }
    }

    return data;
  }

  // route not match
  return null;
};


// MODULE EXPORTS //////////////////////////////////////////////////////////////


module.exports = Matcher;


    return this.exports;
  });
  this.def("7", function (require) {
    var module = this, exports = this.exports;

    'use strict';


var AST = require("8");
var Parser = require("9").parser;


// Propose our AST as `yy` variable to JISON
Parser.yy = AST;


// Export compiler
module.exports.compile = function compile(route) {
  return Parser.parse(route);
};


    return this.exports;
  });
  this.def("8", function (require) {
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
  this.def("9", function (require) {
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
  this.def("2", function (require) {
    var module = this, exports = this.exports;

    'use strict';


var find          = require("4").find;
var getSortedKeys = require("4").getSortedKeys;


////////////////////////////////////////////////////////////////////////////////


function Group() {
  this.__routes__ = {};
  this.__indexRegexp__ = null;
}


//  Group#push(route) -> Void
//  - route (Route):
//
//  Adds `route` to the group.
//
Group.prototype.push = function push(route) {
  var index = '', keys;

  if ('string' === route.__ast__[0].type) {
    index = route.__ast__[0].string;
  }

  if (!this.__routes__[index]) {
    this.__routes__[index] = [];
  }

  this.__routes__[index].push(route);

  // rebuild index regexp
  keys = getSortedKeys(this.__routes__);
  this.__indexRegexp__ = new RegExp('^(?:' + keys.join('|') + ')');

  return;
};


//  Group#match(path) -> Object|Void
//  - path (String):
//
//  Returns first matching route data.
//
Group.prototype.match = function match(path) {
  var index = (this.__indexRegexp__.exec(path) || [])[0];

  return find(this.__routes__[index], function (route) {
    return route.match(path);
  });
};


// MODULE EXPORTS //////////////////////////////////////////////////////////////


module.exports = Group;


    return this.exports;
  });
  this.def("4", function (require) {
    var module = this, exports = this.exports;

    'use strict';


// iterates through array calling iterator on each element.
// stops as soon as iterator return non-falsy value, and returns this value
//
module.exports.find = function find(arr, iter) {
  var i, l, result;

  // make sure arr is an array
  arr = arr || [];

  for (i = 0, l = arr.length; i < l && !result; i++) {
    result = iter(arr[i]);
  }

  return result;
};


// returns object's keys sorted alphabeticaly in descending order
//
//    getSortedKeys({ a: 1, cba: 2, ba: 3 });
//    // -> [ 'cba', 'ba', 'a' ]
//
module.exports.getSortedKeys = function getSortedKeys(obj) {
  var keys = [], k;

  for (k in obj) {
    if (obj.hasOwnProperty(k)) {
      keys.push(k);
    }
  }

  return keys.sort(function (a, b) {
    a = String(a).length;
    b = String(b).length;

    if (a === b) {
      return 0;
    }

    // longest strings comes first
    return (a > b) ? -1 : 1;
  });
};


    return this.exports;
  });
  this.def("3", function (require) {
    var module = this, exports = this.exports;

    'use strict';


// based on Makr Perkins' JQuery URL Parser:
// https://github.com/allmarkedup/jQuery-URL-Parser


var parser = {
      keys:       'source protocol authority userInfo user password host port relative path directory file query fragment'.split(' '), // keys available to query
      strict_re:  /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/, //less intuitive, more accurate to the specs
      loose_re:   /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/ // more intuitive, fails on relative paths and deviates from specs
    },

    isint = /^[0-9]+$/;


function isArray(arr) {
  return Object.prototype.toString.call(arr) === "[object Array]";
}


function reduce(obj, accumulator) {
  var i     = 0,
      l     = +obj.length,
      curr  = arguments[2];

  while (i < l) {
    if (i in obj) {
      curr = accumulator.call(undefined, curr, obj[i], i, obj);
    }
    ++i;
  }

  return curr;
}


function promote(parent, key) {
  if (0 === parent[key].length) {
    return parent[key] = {};
  }

  var i, t = {};

  for (i in parent[key]) {
    t[i] = parent[key][i];
  }

  parent[key] = t;
  return t;
}


function keys(obj) {
  var arr = [], prop;

  for (prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      arr.push(prop);
    }
  }

  return arr;
}


function parse(parts, parent, key, val) {
  var part = parts.shift();

  if (!part) {
    if (isArray(parent[key])) {
      parent[key].push(val);
    } else if ('object' === typeof parent[key]) {
      parent[key] = val;
    } else if ('undefined' === typeof parent[key]) {
      parent[key] = val;
    } else {
      parent[key] = [parent[key], val];
    }
  } else {
    var obj = parent[key] = parent[key] || [];
    if (']' === part) {
      if (isArray(obj)) {
        if (!!val) {
          obj.push(val);
        }
      } else if ('object' === typeof obj) {
        obj[keys(obj).length] = val;
      } else {
        obj = parent[key] = [parent[key], val];
      }
    } else if (-1 !== part.indexOf(']')) {
      part = part.substr(0, part.length - 1);

      if (!isint.test(part) && isArray(obj)) {
        obj = promote(parent, key);
      }

      parse(parts, obj, part, val);
      // key
    } else {
      if (!isint.test(part) && isArray(obj)) {
        obj = promote(parent, key);
      }
      parse(parts, obj, part, val);
    }
  }
}


function set(obj, key, val) {
  var v = obj[key];
  if (undefined === v) {
    obj[key] = val;
  } else if (isArray(v)) {
    v.push(val);
  } else {
    obj[key] = [v, val];
  }
}


function merge(parent, key, val) {
  if (-1 !== key.indexOf(']')) {
    parse(key.split('['), parent, 'base', val);
  } else {
    if (!isint.test(key) && isArray(parent.base)) {
      var k, t = {};

      for (k in parent.base) {
        t[k] = parent.base[k];
      }

      parent.base = t;
    }

    set(parent.base, key, val);
  }

  return parent;
}


function lastBraceInKey(str) {
  var len = str.length,
      brace, c;

  for (var i = 0; i < len; ++i) {
    c = str[i];

    if (']' === c) {
      brace = false;
    }

    if ('[' === c) {
      brace = true;
    }

    if ('=' === c && !brace) {
      return i;
    }
  }
}


function parseString(str) {
  return reduce(String(str).split(/&|;/), function (ret, pair) {
    try {
      pair = decodeURIComponent(pair.replace(/\+/g, ' '));
    } catch (e) {
      // ignore
    }

    var eql   = pair.indexOf('='),
        brace = lastBraceInKey(pair),
        key   = pair.substr(0, brace || eql),
        val;

    val = pair.substr(brace || eql, pair.length);
    val = val.substr(val.indexOf('=') + 1, val.length);

    if (!key) {
      key = pair;
      val = '';
    }

    return merge(ret, key, val);
  }, { base: {} }).base;
}


function parseUri(url, strictMode) {
  var str = decodeURI(url),
      res = parser[strictMode || false ? 'strict_re' : 'loose_re'].exec(str),
      uri = {attr: {}, param: {}, seg: {}},
      i   = 14;

  while (i--) {
    uri.attr[parser.keys[i]] = res[i] || '';
  }

  // build query and fragment parameters
  uri.param['query']    = parseString(uri.attr['query']);
  uri.param['fragment'] = parseString(uri.attr['fragment']);

  // split path and fragement into segments
  uri.seg['path']     = uri.attr.path.replace(/^\/+|\/+$/g, '').split('/');
  uri.seg['fragment'] = uri.attr.fragment.replace(/^\/+|\/+$/g, '').split('/');

  // compile a 'base' domain attribute
  uri.attr['base'] = uri.attr.host || '';

  if (uri.attr.host) {
    if (uri.attr.protocol) {
      uri.attr['base'] = uri.attr.protocol + '://' + uri.attr['base'];
    }

    if (uri.attr.port) {
      uri.attr['base'] = uri.attr['base'] + ':' + uri.attr.port;
    }
  }

  return uri;
}

module.exports = function purl(url, strictMode) {
  url         = String(url);
  strictMode  = !!strictMode;

  return {

    data : parseUri(url, strictMode),

    // get various attributes from the URI
    attr : function (attr) {
      return typeof attr !== 'undefined' ? this.data.attr[attr] : this.data.attr;
    },

    // return query string parameters
    param : function (param) {
      return typeof param !== 'undefined' ? this.data.param.query[param] : this.data.param.query;
    },

    // return fragment parameters
    fparam : function (param) {
      return typeof param !== 'undefined' ? this.data.param.fragment[param] : this.data.param.fragment;
    },

    // return path segments
    segment : function (seg) {
      if (typeof seg === 'undefined') {
        return this.data.seg.path;
      } else {
        seg = seg < 0 ? this.data.seg.path.length + seg : seg - 1; // negative segments count from the end
        return this.data.seg.path[seg];
      }
    },

    // return fragment segments
    fsegment : function (seg) {
      if (typeof seg === 'undefined') {
        return this.data.seg.fragment;
      } else {
        seg = seg < 0 ? this.data.seg.fragment.length + seg : seg - 1; // negative segments count from the end
        return this.data.seg.fragment[seg];
      }
    }

  };
};


    return this.exports;
  });

  return this.req("0");
}.call({}));
