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
  return Object.prototype.toString.call(obj) === '[object RegExp]';
}


function get_value(params, key) {
  var options = params[key];

  if (options && options['default']) {
    return options['default'];
  }

  if (!is_regexp(options)) {
    return options;
  }

  return void 0;
}


//  new Builder(ast)
//  - ast (Array): Array of nodes as returned by Compiler
//
//  Creates instance of builder that can render route with given params
//  See [[Builder#build]].
function Builder(ast, params) {

  // array of param names found in the AST
  // used to validate params in [[Builder#build]]
  this.__known_params__ = [];

  // stack of node builders / nested builders (for optional groups)
  this.__builders__     = [];

  // make sure params is an object
  params = params || {};

  // process given ast into array of builders
  ast.forEach(function (node) {
    if (node.type === 'optional') {
      // node builders implemets same interface as Builder.
      // we use `build()` method to render node, so we can
      // use nested Builder instances for optional groups
      this.__builders__.push(new Builder(node.nodes, params));
    } else if (node.type === 'string') {
      this.__builders__.push(new StringBuilderNode(node));
    } else if (node.type === 'param') {
      this.__known_params__.push({
        key: node.key,
        val: get_value(params, node.key)
      });
      this.__builders__.push(new ParamBuilderNode(node));
    } else {
      // THIS SHOULD NEVER HAPPEN!!!
      throw new Error('Unknown node type: "' + node.type + '".');
    }
  }, this);
}

//  Builder#build([params]) -> String|Null
//  - parmas (Object): Params to fill route with.
//
//  Returns URL representing route with given params.
Builder.prototype.build = function (params) {
  var i, l, obj, val, url;

  // make sure params is an object
  params = params || {};

  // make sure we have enough params to build URL
  for (i = 0, l = this.__known_params__.length; i < l; i++) {
    obj = this.__known_params__[i];
    val = params[obj.key];

    if (typeof val === 'undefined' || (obj.val && val === obj.val)) {
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
