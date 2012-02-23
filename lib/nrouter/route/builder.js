'use strict';


var Common = require('../common');


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


var Builder = module.exports = function Builder(ast) {
  this.__known_params__ = [];
  this.__builders__ = [];

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
      this.__builders__.push(new Builder(node.nodes));
      return;
    }

    // THIS SHOULD NEVER HAPPEN!!!
    throw new Error('Unknown node type: "' + node.type + '".');
  }, this);
};


Builder.prototype.build = function (params) {
  var url, is_valid = true;

  Common.each(this.__known_params__, function (key) {
    if ('undefined' === typeof params[key]) {
      is_valid = false;
      return false;
    }
  });

  if (!is_valid) {
    // not enough params for this builder
    return null;
  }

  url = '';
  Common.each(this.__builders__, function (builder) {
    // make sure we concatenate Strings
    url += (builder.build(params) || '');
  });

  return url;
};
