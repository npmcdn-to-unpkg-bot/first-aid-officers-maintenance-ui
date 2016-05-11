'use strict';

var _ = require('lodash');
var authCookieName = 'auth';

module.exports = function ($http, $q, $cookies, apiSvc) {
  var currentUser;

  function auth(authData) {
    return $q(function (resolve, reject) {
      $http.post(apiSvc.authEndpoint, authData).success(function (data, status) {
        currentUser = data;
        $http.defaults.headers.common['Authorization'] = 'Basic ' + authData; // jshint ignore:line
        $cookies.putObject(authCookieName, authData);
        resolve(data, status);
      }).error(reject);
    });
  }

  return {
    restoreSession: _.partial(auth, $cookies.getObject(authCookieName)),
    authenticate: function (username, password) {
      return auth(btoa(username + ':' + password));
    },
    logout: function () {
      currentUser = undefined;
      delete $http.defaults.headers.common['Authorization']; // jshint ignore:line
      $cookies.remove(authCookieName);
    },
    isLoggedIn: function () {
      return currentUser;
    },
    getInfo: function () {
      return currentUser;
    },
    getRoles: function () {
      return currentUser.roles;
    }
  };
};
