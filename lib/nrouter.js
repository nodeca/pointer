var Crossroads = require('crossroads');
var Underscore = require('underscore');


function error_handler(msg) {
  return function () {
    arguments[arguments.length - 1](new Error(msg));
  };
}


// finds appropriate method by it's cannonical name
function find_api_method(api, str) {
  var k, parts = str.split('.');

  while (parts.length && api) {
    k = parts.shift();
    api = api[k];
  }

  if (undefined === api) {
    return error_handler('Unknown ' + str + ' method');
  }

  if ('function' !== typeof api) {
    return error_handler(str + ' is a scope');
  }

  return api;
}


function build_route_rules(params) {
  var keys = [], rules = {}, defaults = {};

  Underscore.each(params, function (opts, key) {
    if (!opts) {
      throw new Error("Invalid param rules for " + key);
    } else if (Underscore.isArray(opts) || Underscore.isRegExp(opts)) {
      opts = { match: opts };
    } else if (Underscore.isString(opts) && (/^\/.+\//).test(opts)) {
      opts = { match: new RegExp(opts.slice(1, -1)) };
    } else if ('object' !== typeof opts) {
      opts = { value: opts };
    }

    if (opts.value) {
      defaults[key] = opts.value;
    }

    if (opts.match) {
      rules[key] = opts.match;
    }

    keys.push(key);
  });

  rules.normalize_ = function (req, params) {
    var clean = {};

    keys.forEach(function (k) {
      clean[k] = params[k] || defaults[k];
    });

    return clean;
  };

  return rules;
}


var NRouter = module.exports = function NRouter(api) {
  this.__crossroads = Crossroads.create();
  this.__api = api;

  this.notFound = function (request, callback) {
    callback(new Error("Route not found"));
  };
};



NRouter.prototype.addRoute = function addRoute(match, options) {
  var handler, route;

  handler = find_api_method(this.__api, options.to);
  route   = this.__crossroads.addRoute(match, handler);

  route.rules = build_route_rules(options.params);
};


NRouter.prototype.loadRoutes = function loadRoutes(map) {
  var self = this;
  Underscore.each(map, function(options, match) {
    self.addRoute(match, options);
  });
};


NRouter.prototype.dispatch = function dispatch(request, callback) {
  var route = this.__crossroads._getMatchedRoutes(request).shift();

  if (!route) {
    this.notFound(request, callback);
    return;
  }

  route.route.matched.dispatch(route.params, callback);
};
