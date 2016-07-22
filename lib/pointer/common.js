'use strict';


// returns object's keys sorted alphabeticaly in descending order
//
//    getSortedKeys({ a: 1, cba: 2, ba: 3 });
//    // -> [ 'cba', 'ba', 'a' ]
//
exports.getSortedKeys = function getSortedKeys(obj) {

  return Object.keys(obj).sort(function (a, b) {
    a = String(a).length;
    b = String(b).length;

    if (a === b) return 0;

    // longest strings comes first
    return (a > b) ? -1 : 1;
  });
};


////////////////////////////////////////////////////////////////////////////////
// Helpers for serializer

function _class(obj) { return Object.prototype.toString.call(obj); }

function isRegExp(obj) { return _class(obj) === '[object RegExp]'; }
function isDate(obj) { return _class(obj) === '[object Date]'; }
function isFunction(obj) { return _class(obj) === '[object Function]'; }
function isObject(obj) { return _class(obj) === '[object Object]'; }

var stringify;

function stringifyArray(obj) {
  return '[' + obj.map(function (val) { return stringify(val); }).join(',') + ']';
}

function stringifyObject(obj) {
  var props;

  // always deal with sorted list of keys
  props = Object.keys(obj).sort().map(function (key) {
    return JSON.stringify(key) + ':' + stringify(obj[key]);
  });

  return '{' + props.join(',') + '}';
}

stringify = function (obj) {
  if (isFunction(obj)) return obj.toString();

  if (isRegExp(obj)) return 'new RegExp(' + JSON.stringify(obj.source) + ')';

  if (isDate(obj)) return 'new Date("' + String(obj) + '")';

  if (Array.isArray(obj)) return stringifyArray(obj);

  if (isObject(obj)) return stringifyObject(obj);

  return JSON.stringify(obj);
};


exports.stringify = stringify;
