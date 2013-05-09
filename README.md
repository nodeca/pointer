Pointer
=======

[![Build Status](https://secure.travis-ci.org/nodeca/pointer.png)](http://travis-ci.org/nodeca/pointer)

Server/Client router:
https://github.com/nodeca/nodeca/blob/master/docs/nodeca-technical/router.md

``` sh
npm install pointer
```

To make client version:
``` sh
make browserify
```


API Overview
------------


``` javascript
//
// fill in routes
//

// simple case
router.addRoute('/foo/{bar}', {
  params: { bar: /\d+/ },
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
// find matching route
//

var match = router.match(url);
if (match) {
  match.params; // object with params, e.g. {id: 123, page: undefined}
  match.meta;   // your custom data
}
```
