NRouter
=======

Server/Client router for nodeca:
https://github.com/nodeca/nodeca/blob/master/docs/nodeca-technical/router.md

API Overview
------------


```
//
// fill in routes
//

// simple case
router.addRoute('/foo/{bar}', {
  params: { bar: /\d+/ }
}, foobar);

// route wit optional param and it's default value
router.addRoute('/f{forum_id}(-{page}).html', {
  params: {
    forum_id: /\d+/
    page: {
      match: /\d+/
      default: 1
    }
  }
}, forum_list);

// named router (used for linkTo)
router.addRoute('/t{thread_id}', {
  name: 'thread.list',
  params: {
    thread_id: /\d+/
  }
});

// routes grouped by prefix
router.prefix('/assets')
  .addRoute('/js/{file}(-{md5}).{ext}', assets_handler)
  .unprefix();

// sme s above, block style
router.prefix('/assets', function (router) {
  router.addRoute('/css/{file}(-{md5}).{ext}', another_handler);
  // no need to unprefix - it will be auto-unprefixed
});


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
  match.handler; // handler function
}
```


Routes
------

Route definition can be a simple string:

```
/my/very/simple/route
  -> equals RegExp: #/my/very/simple/route#
```

Or string with some parameter (surrounded with `{}`) substitutions:

```
/my/route/with/{some}/param
  -> equals RegExp: #/my/route/with/(?<some>[^/]+)/param#
```

Also it can have optional (surrounded with `()`) part:

```
/my/route/with(/optional)/part
  -> equals RegExp: #/my/route/with(?:/optional)?/part#
```

You may have as many params and optional groups as you want.
You can even nest them:

```
/my/{kind_of}(-router)(.{format})
  -> equals RegExp: #/my/(?<kind_of>[^/]+)(?:-router)?(?:[.](?<format>[^/]+))?#
```


Route Options
-------------

Second argument of `addRoute` is options. It consist of following keys:

-   *name*    (Optional, String): name of the route.
              Used to build URLs with `linkTo()`.
-   *prefix*  (Optional, String): think of it as of mount point.
              You can use `prefix()` as well, which is a syntax sugar
              that sets this option.
-   *params*  (Optional, Object): options of params in the route.
              See description below.

### Params Options

Params are given in form of `param_name -> param_options` pairs. Options might
be an Object (see Syntax Sugar below) or RegExp (shorthand for `{match: ...}`).

-   *match*   (Optional, RegExp, Default: [^/]+): RegExp that param should match
-   *default* (Optional, Mixed): Default value, if param was not presented in
              the URL upon `match()` (when it was in the optional group).

You are free to specify as many `params` options as you want. You also can
specify options of params that are not presented in matching rule, so their
`default` values willl be used when matching route will be found, e.g.:

```
router.addRoute('/t{thread_id}/last-page.html', {
  params: {
    thread_id: /\d+/,
    page: -1
  }
}, forum.thread.list);
```


##### Syntax Sugar

You may specify param options as RegExp, in this case it will be equal to
specifying only `match` option, these are equal:

```
{
  thread_id: /\d+/
}

// shorthand syntax for:

{
  thread_id: {
    match: /\d+/
  }
}
```

Also you can specify param options as `String` or `Integer`, in this case it
will be equal to specifying `default` option only:


```
{
  page: 123
}

// shorthand syntax for:

{
  page: {
    defult: 123
  }
}
```
