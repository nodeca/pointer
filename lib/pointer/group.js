'use strict';


var find          = require('./common').find;
var getSortedKeys = require('./common').getSortedKeys;


////////////////////////////////////////////////////////////////////////////////


function Group() {
  this.__routes__ = {};
  this.__indexRegexp__ = null;
}


//  Group#push(route) -> Void
//  - route (Route):
//
//  Adds `route` to the group.
//
Group.prototype.push = function push(route) {
  var index = '', keys;

  if ('string' === route.__ast__[0].type) {
    index = route.__ast__[0].string;
  }

  if (!this.__routes__[index]) {
    this.__routes__[index] = [];
  }

  this.__routes__[index].push(route);

  // rebuild index regexp
  keys = getSortedKeys(this.__routes__);
  this.__indexRegexp__ = new RegExp('^(?:' + keys.join('|') + ')');

  return;
};


//  Group#match(path) -> Object|Void
//  - path (String):
//
//  Returns first matching route data.
//
Group.prototype.match = function match(path) {
  var index = (this.__indexRegexp__.exec(path) || [])[0];

  return find(this.__routes__[index], function (route) {
    return route.match(path);
  });
};


// MODULE EXPORTS //////////////////////////////////////////////////////////////


module.exports = Group;
