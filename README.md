nrouter
=======

Server/Client router for nodeca:
https://github.com/nodeca/nodeca/blob/master/docs/nodeca-technical/router.md

``` javascript
router.addRoute("/threads/{thread_id}(-{page}).html", {
  thread_id: /\d+/
  page: {
    match: /\d+/
    default: 1
  }
}, nodeca.server.forum.threads.show);
```


Syntax of routes
----------------

Parameters are surrounded with `{}`. Also you can make some part of your route
optional `()`.

```
/threads/{id}(-{page}).html
  -> /threads/123-10.html
  -> /threads/123.html
/posts/{id}(.html)
  -> /posts/123.html
  -> /posts/123
```

Params matching
---------------

When specifiying route you can provide additional options of parameters (second
argument of `addRoute()` as map of `key => options`.

Options might contain:

  - match: regexp to match against
  - default: default value (used when no value exist, only when param is
    inside optional group)
