'use strict';


var getSortedKeys = require('./common').getSortedKeys;


////////////////////////////////////////////////////////////////////////////////


function Group() {
  this.__routes__ = {};
  this.__prefixes__ = [];
}


//  Group#push(route) -> Void
//  - route (Route):
//
//  Adds `route` to the group.
//
Group.prototype.push = function push(route) {
  var prefix = '';

  if ('string' === route.__ast__[0].type) {
    prefix = route.__ast__[0].string;
  }

  if (!this.__routes__[prefix]) {
    this.__routes__[prefix] = [];
  }

  this.__routes__[prefix].push(route);
  this.__prefixes__ = getSortedKeys(this.__routes__);
};


//  Group#match(path) -> Object|Void
//  - path (String):
//
//  Returns first matching route data.
//
Group.prototype.match = function match(path) {
  var self = this,
      prefix,
      prefixIndex,
      prefixCount,
      route,
      routeIndex,
      routeCount,
      result;

  for (prefixIndex = 0, prefixCount = self.__prefixes__.length;
       prefixIndex < prefixCount;
       prefixIndex += 1) {
    prefix = self.__prefixes__[prefixIndex];

    // Match prefix. If not - go on with next prefix.
    if (prefix !== path.slice(0, prefix.length)) {
      continue;
    }

    // Walk over routes by prefix and return a first matched if any.
    for (routeIndex = 0, routeCount = self.__routes__[prefix].length;
         routeIndex < routeCount;
         routeIndex += 1) {
      route = self.__routes__[prefix][routeIndex];
      result = route.match(path);

      if (result) {
        return result;
      }
    }
  }

  // Not found.
  return null;
};


// MODULE EXPORTS //////////////////////////////////////////////////////////////


module.exports = Group;
