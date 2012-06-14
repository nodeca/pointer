'use strict';


// stdlib
var fs      = require('fs');
var path    = require('path');
var falafel = require('falafel');


// 3rd-party
var _         = require('underscore');
var mustache  = require('mustache');


function uid(file) {
  if (!uid.files[file]) {
    uid.files[file] = '"' + uid.idx + '"';
    uid.idx += 1;
  }

  return uid.files[file];
}

uid.files = {};
uid.idx   = 0;


function resolve(basepath, filename) {
  var file = path.resolve(basepath, filename);

  if (!/^[.]{0,2}\//.test(filename)) {
    // FIXME: respect modulenames
    return null;
  }

  return require.resolve(file);
}


function process(self) {
  var source = fs.readFileSync(self.filename, 'utf8'), file;

  self.source = falafel(source, function (node) {
    if (node && 'CallExpression' === node.type && 'require' === node.callee.name) {
      try {
        file = resolve(self.basepath, node.arguments[0].value);
      } catch (err) {
        throw new Error('Failed locate module "' + node.arguments[0].value + '" for ' +
                        '"' + self.filename + '":\n' + err.message);
      }

      if (!!file) {
        node.arguments[0].update(uid(file));
        self.requires.push(file);
      }
    }
  });
}


function File(filename) {
  this.filename = require.resolve(filename);
  this.basepath = path.dirname(filename);
  this.requires = [];
  this.uid      = uid(this.filename);

  process(this);
}


var TEMPLATE = require('fs').readFileSync(__dirname + '/template.mustache', 'utf8');


var Collector = module.exports = function Collector(filename) {
  this.filename = require.resolve(filename);
  this.sources  = {};
};


Collector.prototype.collect = function (filename) {
  if (this.sources[filename]) {
    return;
  }

  // read source file
  this.sources[filename] = new File(filename);

  // process it's requires
  this.sources[filename].requires.forEach(function (f) {
    this.collect(f);
  }, this);
};


Collector.prototype.toString = function toString(moduleName) {
  this.collect(this.filename);
  return mustache.render(TEMPLATE, {
    uid: this.sources[this.filename].uid,
    sources: _.values(this.sources),
    name: (moduleName || 'MyModule')
  });
};
