'use strict';


var Assert = require('assert');
var Route = require('../../lib/nrouter/route');


// tmp measure to test parser
var tmp;
tmp = new Route('');
tmp = new Route('/article/{category.slug}');
tmp = new Route('/article/{category.slug}/\\{id}-{id}');
tmp = new Route('/article/{category.slug}/{id}(.html)');
tmp = new Route('/article/{category.slug}/{id}(-{slug})(.{format})');
tmp = new Route('/article/{category.slug}/{id}\\{hehe}(-{slug})(.{format})');

require('vows').describe('NRouter.Route').addBatch({
  'need tests': 'tdb'
}).export(module);
