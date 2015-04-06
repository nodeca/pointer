/*global describe, it*/


'use strict';


var assert    = require('assert');
var Compiler  = require('../../../lib/pointer/route/compiler');


////////////////////////////////////////////////////////////////////////////////


// map of node type simplification
var NODES = { string: 's', param: 'p' };


// maps compiled ast into array of strings representing nodes
function mapNodes(node) {
  if (node.type === 'optional') {
    return node.nodes.map(mapNodes);
  }

  return NODES[node.type] || '!';
}



// helper to test compiled ast against expected nodes list
function testCompiler(route, expectedNodes) {
  describe('with \'' + route + '\' route', function () {
    var actualNodes = Compiler.compile(route).map(mapNodes);

    it('should generate AST', function () {
      assert.deepEqual(actualNodes, expectedNodes);
    });
  });
}


////////////////////////////////////////////////////////////////////////////////


describe('Pointer.Route.Compiler', function () {
  testCompiler('',                        []);
  testCompiler('/foo',                    [ 's' ]);
  testCompiler('/foo/{bar}',              [ 's', 'p' ]);
  testCompiler('/foo(/{bar})',            [ 's', [ 's', 'p' ] ]);
  testCompiler('/foo/{bar}(/({baz}moo))', [ 's', 'p', [ 's', [ 'p', 's' ] ] ]);

  // escaping

  testCompiler('/foo\\{bar}',           [ 's', 's', 's', 's' ]);
  testCompiler('/foo{bar\\}baz}',       [ 's', 'p' ]);
  testCompiler('/foo\\(bar)',           [ 's', 's', 's', 's' ]);
  testCompiler('/foo(bar\\)baz)',       [ 's', [ 's', 's', 's' ] ]);
  testCompiler('/foo(bar\\)(baz)moo)',  [ 's', [ 's', 's', [ 's' ], 's' ] ]);
  testCompiler('/foo/\\({b}(-{a}\\))r', [ 's', 's', 'p', [ 's', 'p', 's' ], 's' ]);
});
