'use strict';


// stdlib
var path = require('path');


// internal
var Collector = require('./collector/collector');


var precious = new Collector(path.resolve(__dirname, '../lib/pointer'));
console.log(precious.toString('Pointer = window.Pointer'));
