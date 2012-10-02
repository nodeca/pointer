'use strict';


////////////////////////////////////////////////////////////////////////////////


function Group() {
  this.__routes__ = [];
}


//  Group#push(route) -> Void
//  - route (Route):
//
//  Adds `route` to the group.
//
Group.prototype.push = function push(route) {
  this.__routes__.push(route);
  return;
};


//  Group#scope(url) -> Array
//  - url (String):
//
//  Returns array of Routes that might match `url`
//
Group.prototype.scope = function scope() {
  return this.__routes__;
};


// MODULE EXPORTS //////////////////////////////////////////////////////////////


module.exports = Group;
