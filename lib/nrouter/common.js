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
  keys = Object.getOwnPropertyNames(obj);

  // not using Array#forEach, as it does not allows to stop iterator
  for (i = 0, l = keys.length; i < l; i += 1) {
    if (false === iterator.call(context, obj[keys[i]], keys[i], obj)) {
      // break
      return;
    }
  }
};
