'use strict';


var AST = require('./ast');
var Parser = require('./parser').parser;


// Propose our AST as `yy` variable to JISON
Parser.yy = AST;


// Export compiler
module.exports.compile = function (route) {
  return Parser.parse(route);
};
