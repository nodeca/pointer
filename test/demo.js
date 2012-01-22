var NRouter = require('./..');
var ApiTree = require('./data/api-tree');
var JsYaml = require('js-yaml');


var config = require('./data/routes.yml').shift();
var router = new NRouter(ApiTree);


var handler = function (err, data) {
  if (err) {
    console.error('ERROR: ' + err);
    return;
  }

  console.log(data);
};


router.loadRoutes(config.routes);
router.dispatch("/f123/", handler);
router.dispatch("/f123/index2.html/", handler);
router.dispatch("/f123/thread123.html/", handler);
router.dispatch("/2012/01/123.html/", handler);
