1.0.2 / 2017-07-26
------------------

- Fix typo in `.parseURL()`.


1.0.1 / 2016-08-01
------------------

- Workaround for node's external parser (it adds `/` for empty paths).
- Edge case fix: domain root without trailing `/` should
  be recognized.


1.0.0 / 2016-07-22
------------------

- Make internal parser compatible with node's `require('url').parser`.
- Allow use node's parser instead of built-in.


0.3.3 / 2016-01-13
------------------

- Allow init without "new" keyword.


0.3.2 / 2015-11-13
------------------

- Fixed crash on "invalid" query sequence (`http://example.com/?[]&test=1`).


0.3.1 / 2015-05-01
------------------

- `.linkTo()` fix.


0.3.0 / 2015-04-07
------------------

- Make `.linkTo()` return the longest possible match.


0.2.0 / 2014-07-22
------------------

- Added `config` property (Array), that store added routes in original form.
- Added `stringify()` method to dump router content for client asset.
- Constructor now accepts array of routes.
- Deprecated `create()` method.


0.1.8 / 2014-05-19
------------------

- Option to coerce route param to integer.


0.1.7 / 2013-06-17
------------------

- Prevent exceptions on invalid URL format.


0.1.6 / 2013-06-12
------------------

- Add ability to fill-in missed parts of URL prefix (protocol etc) via `linkTo`.


0.1.5 / 2013-05-13
------------------

- Add Pointer#matchAll method.


0.1.4 / 2013-05-09
------------------

- Pointer#addRoute: pattern can be passed via options object.
- Allow to add routes with multiple names.


0.1.3 / 2013-04-05
------------------

- Fixed similar routes matching (#2)


0.1.2 / 2013-03-19
------------------

- Changed browserifier


0.1.1 / 2012-10-02
------------------

- Optimize route matching.
- Relax Pointer#linkTo() to skip param matching.


0.1.0 / 2012-10-02
------------------

- First public release.
