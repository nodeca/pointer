Pointer
=======

[![Build Status](https://secure.travis-ci.org/nodeca/pointer.png)](http://travis-ci.org/nodeca/pointer)

Server/Client router for nodeca:
https://github.com/nodeca/nodeca/blob/master/docs/nodeca-technical/router.md

API Overview
------------


``` javascript
//
// fill in routes
//

// simple case
router.addRoute('/foo/{bar}', {
  params: { bar: /\d+/ }
}, foobar);

// route with optional param and it's default value
router.addRoute('/f{forum_id}(-{page}).html', {
  params: {
    forum_id: /\d+/
    page: {
      match: /\d+/
      default: 1
    }
  }
}, forum_list);

// route with optional anchor (useful for in-browser use)
router.addRoute('/page.html', {
  anchor: 'anchor={keyword}',
  params: {
    keyword: /\S+/
  }
}, page);

// named router (used for linkTo)
router.addRoute('/t{thread_id}', {
  name: 'thread.list',
  params: {
    thread_id: /\d+/
  }
}, thread_list);

// routes grouped by prefix
router.addRoute('/css/{file}(-{md5}).{ext}', {
  prefix: '/assets'
}, another_handler);
// -> /assets/css/{file}(-{md5}).{ext}


//
// Build links
//

router.linkTo('thread.list', {
  thread_id: 123
}); // -> /t123


//
// find matching route
//

var match = router.match(url);
if (match) {
  match.params; // -> object with params, e.g. {id: 123, page: undefined}
  match.meta;   // handler function
}
```
