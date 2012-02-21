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


AST.MetaChrNode = function (quantifier) {
  this.type = 'metachar';
  this.quantifier = quantifier;
};


AST.OptionalGroupNode = function (nodes) {
  this.type = 'optional';
  this.nodes = nodes;
};
