function handler(name) {
  return function (options, cb) {
    console.log(name + ': enter');
    console.log(name + ': ' + JSON.stringify(options));

    cb(null, name + ': exit');
  };
}


var api = module.exports = {};


api.forum = {};
api.forum.list = handler('forum.list');
api.forum.threads = {};
api.forum.threads.show = handler('forum.threads.show');

api.blog = {};
api.blog.posts = {};
api.blog.posts.show = handler('blog.posts.show');
