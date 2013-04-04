'use strict';


var find          = require('./common').find;
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
  var self = this;

  return find(self.__prefixes__, function (prefix) {
    if (prefix === path.slice(0, prefix.length)) {
      return find(self.__routes__[prefix], function (route) {
        return route.match(path);
      });
    } else {
      return null;
    }
  });
};


// MODULE EXPORTS //////////////////////////////////////////////////////////////


module.exports = Group;
