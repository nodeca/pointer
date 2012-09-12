'use strict';


// based on Makr Perkins' JQuery URL Parser:
// https://github.com/allmarkedup/jQuery-URL-Parser


var parser = {
      keys:       'source protocol authority userInfo user password host port relative path directory file query fragment'.split(' '), // keys available to query
      strict_re:  /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/, //less intuitive, more accurate to the specs
      loose_re:   /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/ // more intuitive, fails on relative paths and deviates from specs
    },

    isint = /^[0-9]+$/;


function isArray(arr) {
  return Object.prototype.toString.call(arr) === "[object Array]";
}


function reduce(obj, accumulator){
  var i     = 0,
      l     = +obj.length,
      curr  = arguments[2];

  while (i < l) {
    if (i in obj) {
      curr = accumulator.call(undefined, curr, obj[i], i, obj);
    }
    ++i;
  }

  return curr;
}


function promote(parent, key) {
  if (0 === parent[key].length) {
    return parent[key] = {};
  }

  var i, t = {};

  for (i in parent[key]) {
    t[i] = parent[key][i];
  }

  parent[key] = t;
  return t;
}


function keys(obj) {
  var arr = [], prop;

  for ( prop in obj ) {
    if ( obj.hasOwnProperty(prop) ) {
      arr.push(prop);
    }
  }

  return arr;
}


function parse(parts, parent, key, val) {
  var part = parts.shift();

  if (!part) {
    if (isArray(parent[key])) {
      parent[key].push(val);
    } else if ('object' === typeof parent[key]) {
      parent[key] = val;
    } else if ('undefined' === typeof parent[key]) {
      parent[key] = val;
    } else {
      parent[key] = [parent[key], val];
    }
  } else {
    var obj = parent[key] = parent[key] || [];
    if (']' === part) {
      if (isArray(obj)) {
        if (!!val) {
          obj.push(val);
        }
      } else if ('object' === typeof obj) {
        obj[keys(obj).length] = val;
      } else {
        obj = parent[key] = [parent[key], val];
      }
    } else if (-1 !== part.indexOf(']')) {
      part = part.substr(0, part.length - 1);

      if (!isint.test(part) && isArray(obj)) {
        obj = promote(parent, key);
      }

      parse(parts, obj, part, val);
      // key
    } else {
      if (!isint.test(part) && isArray(obj)) {
        obj = promote(parent, key);
      }
      parse(parts, obj, part, val);
    }
  }
}


function set(obj, key, val) {
  var v = obj[key];
  if (undefined === v) {
    obj[key] = val;
  } else if (isArray(v)) {
    v.push(val);
  } else {
    obj[key] = [v, val];
  }
}


function merge(parent, key, val) {
  if (-1 !== key.indexOf(']')) {
    parse(key.split('['), parent, 'base', val);
  } else {
    if (!isint.test(key) && isArray(parent.base)) {
      var k, t = {};

      for (k in parent.base) {
        t[k] = parent.base[k];
      }

      parent.base = t;
    }

    set(parent.base, key, val);
  }

  return parent;
}


function lastBraceInKey(str) {
  var len = str.length,
      brace, c;

  for (var i = 0; i < len; ++i) {
    c = str[i];

    if (']' === c) {
      brace = false;
    }

    if ('[' === c) {
      brace = true;
    }

    if ('=' === c && !brace) {
      return i;
    }
  }
}


function parseString(str) {
  return reduce(String(str).split(/&|;/), function(ret, pair) {
    try {
      pair = decodeURIComponent(pair.replace(/\+/g, ' '));
    } catch(e) {
      // ignore
    }

    var eql   = pair.indexOf('='),
        brace = lastBraceInKey(pair),
        key   = pair.substr(0, brace || eql),
        val;

    val = pair.substr(brace || eql, pair.length);
    val = val.substr(val.indexOf('=') + 1, val.length);

    if (!key) {
      key = pair;
      val = '';
    }

    return merge(ret, key, val);
  }, { base: {} }).base;
}


function parseUri( url, strictMode ) {
  var str = decodeURI( url ),
      res = parser[ strictMode || false ? 'strict_re' : 'loose_re' ].exec( str ),
      uri = { attr : {}, param : {}, seg : {} },
      i   = 14;

  while ( i-- ) {
    uri.attr[ parser.keys[i] ] = res[i] || '';
  }

  // build query and fragment parameters
  uri.param['query']    = parseString(uri.attr['query']);
  uri.param['fragment'] = parseString(uri.attr['fragment']);

  // split path and fragement into segments
  uri.seg['path']     = uri.attr.path.replace(/^\/+|\/+$/g,'').split('/');
  uri.seg['fragment'] = uri.attr.fragment.replace(/^\/+|\/+$/g,'').split('/');

  // compile a 'base' domain attribute
  uri.attr['base'] = uri.attr.host || '';

  if (uri.attr.host) {
    if (uri.attr.protocol) {
      uri.attr['base'] = uri.attr.protocol + '://' + uri.attr['base'];
    }

    if (uri.attr.port) {
      uri.attr['base'] = uri.attr['base'] + ':' + uri.attr.port;
    }
  }

  return uri;
}

module.exports = function purl( url, strictMode ) {
  url         = String(url);
  strictMode  = !!strictMode;

  return {

    data : parseUri(url, strictMode),

    // get various attributes from the URI
    attr : function( attr ) {
      return typeof attr !== 'undefined' ? this.data.attr[attr] : this.data.attr;
    },

    // return query string parameters
    param : function( param ) {
      return typeof param !== 'undefined' ? this.data.param.query[param] : this.data.param.query;
    },

    // return fragment parameters
    fparam : function( param ) {
      return typeof param !== 'undefined' ? this.data.param.fragment[param] : this.data.param.fragment;
    },

    // return path segments
    segment : function( seg ) {
      if ( typeof seg === 'undefined' ) {
        return this.data.seg.path;
      } else {
        seg = seg < 0 ? this.data.seg.path.length + seg : seg - 1; // negative segments count from the end
        return this.data.seg.path[seg];
      }
    },

    // return fragment segments
    fsegment : function( seg ) {
      if ( typeof seg === 'undefined' ) {
        return this.data.seg.fragment;
      } else {
        seg = seg < 0 ? this.data.seg.fragment.length + seg : seg - 1; // negative segments count from the end
        return this.data.seg.fragment[seg];
      }
    }

  };
};
