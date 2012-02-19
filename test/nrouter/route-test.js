'use strict';


var Assert = require('assert');
var Route = require('../../lib/nrouter/route');


// tmp measure to test parser
var tmp = new Route('/article/{category.slug}/{id}(-{slug})(.{format})');


require('vows').describe('NRouter.Route').addBatch({
  'need tests': 'tdb'
}).export(module);
