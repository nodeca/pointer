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

  if (route.__ast__[0].type === 'string') {
    prefix = route.__ast__[0].string;
  }

  if (!this.__routes__[prefix]) {
    this.__routes__[prefix] = [];
  }

  this.__routes__[prefix].push(route);
  this.__prefixes__ = getSortedKeys(this.__routes__);
};


function __match__(group, path, resultArray) {
  var prefix,
      prefixIndex,
      prefixCount,
      route,
      routeIndex,
      routeCount,
      resultSingle;

  for (prefixIndex = 0, prefixCount = group.__prefixes__.length;
       prefixIndex < prefixCount;
       prefixIndex += 1) {

    if (resultSingle && !resultArray) {
      break; // found - stop here
    }

    prefix = group.__prefixes__[prefixIndex];

    // Match prefix. If not - go on with next prefix.
    if (path.indexOf(prefix) !== 0) {
      continue;
    }

    // Walk over routes by prefix and return a first matched if any.
    for (routeIndex = 0, routeCount = group.__routes__[prefix].length;
         routeIndex < routeCount;
         routeIndex += 1) {
      route = group.__routes__[prefix][routeIndex];
      resultSingle = route.match(path);

      if (!resultSingle) {
        continue;
      }

      if (resultArray) {
        resultArray.push(resultSingle);
      } else {
        break; // single route is found - stop
      }
    }
  }

  return resultArray || resultSingle || null;
}


//  Group#match(path) -> Object|Void
//  - path (String):
//
//  Returns first matching route data.
//
Group.prototype.match = function match(path) {
  return __match__(this, path, null);
};


//  Group#matchAll(path) -> Array
//  - path (String):
//  - resultArray (Optional, Array): to push match result to
//
//  Returns first matching route data.
//
Group.prototype.matchAll = function matchAll(path, resultArray) {
  return __match__(this, path, resultArray);
};


// MODULE EXPORTS //////////////////////////////////////////////////////////////


module.exports = Group;
