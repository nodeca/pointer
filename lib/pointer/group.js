'use strict';


var find          = require('./common').find;
var getSortedKeys = require('./common').getSortedKeys;


////////////////////////////////////////////////////////////////////////////////


function Group() {
  this.__routes__ = {};
  this.__cache__  = null;
  this.__regexp__ = null;
}


function rebuild_regexp(self) {
  var keys = getSortedKeys(self.__routes__);
  self.__regexp__ = new RegExp('^(?:' + keys.join('|') + ')');
}


function rebuild_cache(self) {
  var keys = getSortedKeys(self.__routes__),
      generic = self.__routes__[''] || [],
      leader;

  self.__cache__ = {};

  while (keys.length) {
    leader = keys.shift();

    if ('' !== leader) {
      self.__cache__[leader] = self.__routes__[leader].concat(generic);
    } else {
      self.__cache__[leader] = self.__routes__[leader];
    }
  }
}


//  Group#push(route) -> Void
//  - route (Route):
//
//  Adds `route` to the group.
//
Group.prototype.push = function push(route) {
  var leader = '';

  if ('string' === route.__ast__[0].type) {
    leader = route.__ast__[0].string;
  }

  if (!this.__routes__[leader]) {
    this.__routes__[leader] = [];
  }

  this.__routes__[leader].push(route);

  rebuild_regexp(this);
  rebuild_cache(this);

  return;
};


//  Group#match(path) -> Object|Void
//  - path (String):
//
//  Returns first matching route data.
//
Group.prototype.match = function match(path) {
  var leader = (this.__regexp__.exec(path) || [])[0];

  if ('undefined' === typeof leader) {
    return;
  }

  return find(this.__cache__[leader], function (route) {
    return route.match(path);
  });
};


// MODULE EXPORTS //////////////////////////////////////////////////////////////


module.exports = Group;
