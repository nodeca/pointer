'use strict';


var Assert = require('assert');
var Compiler = require('../../../lib/nrouter/route/compiler');
var Common = require('../../../lib/nrouter/common');



// creates a map of node types
function map_nodes(nodes) {
  var map = [];

  nodes.forEach(function (node) {
    map.push(
      ('optional' === node.type) ? map_nodes(node.nodes)
                                 : {'string': 's', 'param': 'p'}[node.type]
    );
  });

  return map;
}


function test_compiler(definitions) {
  var tests = {};

  Common.each(definitions, function (expected, route) {
    tests["Route: '" + route + "'"] = function () {
      var ast = Compiler.compile(route);
      Assert.deepEqual(map_nodes(ast), expected);
    };
  });

  return tests;
}


require('vows').describe('NRouter.Route.Compiler').addBatch({
  'Compiling route into AST': test_compiler({
    '': [],
    '/foo': ['s'],
    '/foo/{bar}': ['s','p'],
    '/foo(/{bar})': ['s',['s','p']],
    '/foo/{bar}(-{baz})(/(({deep}sheep)))': ['s','p',['s','p'],['s',[['p','s']]]],

    // testing escaping
    '/foo\\{test}': ['s'],
    '/foo{test\\}more}': ['s','p'],
    '/foo\\(test)': ['s'],
    '/foo(test\\)more)': ['s',['s']],
    '/foo(test\\)(inner)more)': ['s',['s',['s'],'s']],
    '/foo/\\({a}(-{b}\\))crazzy': ['s','p',['s','p','s'],'s']
  })
}).export(module);
