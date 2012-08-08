'use strict';


var Common = require('../common');


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


//  new Builder(ast)
//  - ast (Array): Array of nodes as returned by Compiler
//
//  Creates instance of builder that can render route with given params
//  See [[Builder#build]].
function Builder(ast) {
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
}

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
    return null;
  }

  url = '';

  // render and concatenate all parts
  Common.each(this.__builders__, function (builder) {
    url += builder.build(params) || '';
  });

  return url;
};


// MODULE EXPORTS //////////////////////////////////////////////////////////////


module.exports = Builder;
