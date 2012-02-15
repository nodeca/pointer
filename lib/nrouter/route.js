/**
 *  class NRouter.Route
 **/


'use strict';


/**
 *  new NRouter.Route(match[, params], handler)
 *  - match (String):
 *  - params (Object):
 *  - handler (Function):
 **/
var Route = module.exports = function Route(match, params, handler) {
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
