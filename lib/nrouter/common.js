'use strict';


var Common = module.exports = {};


// iterates through all object keys-value pairs calling iterator on each one
// example: $$.each(objOrArr, function (val, key) { /* ... */ });
Common.each = function each(obj, iterator, ctx) {
  var key, i, len;

  // skip empty
  if (null === obj || undefined === obj) {
    return;
  }

  ctx = ctx || iterator;
  len = obj.length;

  if (len === undefined) {
    // iterate through objects
    for (key in obj) {
      if (obj.hasOwnProperty(key) && false === iterator.call(ctx, obj[key], key)) {
        return;
      }
    }
  } else {
    // iterate through array
    for (i = 0; i < len; i += 1) {
      if (false === iterator.call(ctx, obj[i], i)) {
        return;
      }
    }
  }
};
