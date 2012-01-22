var NRouter = require('.');


var api_tree = {
  forum: {
    posts: {
      show: function (id, cb) {
      },

      list: function (cb) {

      }
    }
  }
};


var routes = {
};



// init router
var r = new NRouter(api_tree, routes);


// tests
