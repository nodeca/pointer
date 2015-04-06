Pointer
=======

[![Build Status](https://img.shields.io/travis/nodeca/pointer/master.svg?style=flat)](https://travis-ci.org/markdown-it/markdown-it)
[![NPM version](https://img.shields.io/npm/v/pointer.svg?style=flat)](https://www.npmjs.org/package/markdown-it)

> Server/Client router:

API docs: http://nodeca.github.io/pointer/


```
npm install pointer
```

To make client version:
```
make browserify
```

You also need a modern browser or [es5-shims](https://github.com/kriskowal/es5-shim)
to get it working.


API Overview
------------


``` javascript
//
// fill in routes
//

// simple case
router.addRoute('/foo/{bar}', {
  params: {
    bar: /\d+/,
    type: 'integer' /* coerce result to int (string by default) */
  },
  meta: /* any data you want */
});

// with single parameter
router.addRoute({
  pattern: '/foo/{bar}',
  params: { bar: /\d+/ },
  meta: /* any data you want */
});

// route with optional param and it's default value
router.addRoute('/f{forum_id}(-{page}).html', {
  params: {
    forum_id: /\d+/
    page: {
      match: /\d+/
      default: 1
    }
  },
  meta: /* any data you want */
};

// named router (used for linkTo)
router.addRoute('/t{thread_id}', {
  name: 'thread.list',
  params: {
    thread_id: /\d+/
  },
  meta: /* any data you want */
});

// routes grouped by prefix
router.addRoute('/css/{file}(-{md5}).{ext}', {
  prefix: '/assets',
  meta: /* any data you want */
});
// -> /assets/css/{file}(-{md5}).{ext}


//
// Build links
//

router.linkTo('thread.list', {
  thread_id: 123
}); // -> '/t123'


//
// Build links with filling of missed parts.
//

router.linkTo('page', { id: 13 }) // -> '//domain.com/page/13'

router.linkTo('page', { id: 13 }, {
  protocol: 'http',
  hostname: 'defaultdomain.com',
  port:     3000
}) // -> 'http://domain.com:3000/page/13'


//
// find matching route
//

var match = router.match(url);
if (match) {
  match.params; // object with params, e.g. {id: 123, page: undefined}
  match.meta;   // your custom data
}


//
// Dump routes to "executable" string for client asset.
// Needed to keep regexps properly.
//

console.log(router.stringify());

var clientRouter = new Pointer(router.stringify());
```
