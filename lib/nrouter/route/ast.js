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