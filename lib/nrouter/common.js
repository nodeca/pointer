'use strict';


var Common = module.exports = {};


// iterates through all object keys-value pairs calling iterator on each one
// example: $$.each(objOrArr, function (val, key) { /* ... */ });
Common.each = function each(obj, iterator, context) {
  var keys, i, l;

  if (null === obj || undefined === obj) {
    return;
  }

  context = context || iterator;

  if (Array.prototype.forEach && obj.forEach === Array.prototype.forEach) {
    obj.forEach(iterator, context);
  } else {
    keys = Object.getOwnPropertyNames(obj);
    for (i = 0, l = keys.length; i < l; i += 1) {
      iterator.call(context, obj[keys[i]], keys[i], obj);
    }
  }
};
