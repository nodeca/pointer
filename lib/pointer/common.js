'use strict';


// iterates through array calling iterator on each element.
// stops as soon as iterator return non-falsy value, and returns this value
//
module.exports.find = function find(arr, iter) {
  var i, l, result;

  for (i = 0, l = arr.length; i < l && !result; i++) {
    result = iter(arr[i]);
  }

  return result;
};


// returns object's keys sorted alphabeticaly in descending order
//
//    getSortedKeys({ a: 1, cba: 2, ba: 3 });
//    // -> [ 'cba', 'ba', 'a' ]
//
module.exports.getSortedKeys = function getSortedKeys(obj) {
  var keys = [], k;

  for (k in obj) {
    if (obj.hasOwnProperty(k)) {
      keys.push(k);
    }
  }

  return keys.sort(function (a, b) {
    a = String(a).length;
    b = String(b).length;

    if (a === b) {
      return 0;
    }

    // longest strings comes first
    return (a > b) ? -1 : 1;
  });
};
