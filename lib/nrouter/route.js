/**
 *  class NRouter.Route
 **/


'use strict';


/**
 *  new NRouter.Route(match[, params])
 *  - match (String):
 *  - params (Object):
 **/
var Route = module.exports = function Route(match, params) {
  throw "Not implemented yet";
};


/**
 *  NRouter.Route#setHandler(fn) -> Void
 **/
Route.prototype.setHandler = function setHandler(fn) {
  throw "Not implemented yet";
};


/**
 *  NRouter.Route#match(url) -> NRouter.Route.MatchData|Null
 *  - url (String):
 **/
Route.prototype.match = function match(url) {
  throw "Not implemented yet";
};


/**
 *  NRouter.Route#isValidParams(params) -> Boolean
 **/
Route.prototype.isValidParams = function isValidParams(params) {
  throw "Not implemented yet";
};


/**
 *  NRouter.Route#buildURL(params) -> String
 **/
Route.prototype.buildURL = function buildURL(params) {
  throw "Not implemented yet";
};
