'use strict';
/*jshint camelcase: false*/

module.exports = function ($http, $q, apiSvc) {

  var adminSvc = {};

  adminSvc.resetUserPassword = function (empl_pk) {
    return apiSvc.delete(apiSvc.adminEndpoint + 'users/' + empl_pk + '/password');
  };

  adminSvc.setPassword = function (pwd_current, pwd_new) {
    return apiSvc.put(apiSvc.accountEndpoint + 'password', {
      pwd_current: pwd_current,
      pwd_new: pwd_new
    });
  };

  adminSvc.getInfo = function () {
    return apiSvc.get(apiSvc.accountEndpoint);
  };

  adminSvc.getUsers = function () {
    return apiSvc.get(apiSvc.adminEndpoint + 'users/');
  };

  adminSvc.getUserInfo = function (empl_pk) {
    return apiSvc.get(apiSvc.adminEndpoint + 'users/' + empl_pk);
  };

  adminSvc.updateUser = function (empl_pk, roles) {
    return $http.put(apiSvc.adminEndpoint + 'users/' + empl_pk, roles);
  };

  adminSvc.deleteUser = function (empl_pk) {
    return $http.delete(apiSvc.adminEndpoint + 'users/' + empl_pk);
  };

  adminSvc.getTrainerlevels = function () {
    return apiSvc.get(apiSvc.adminEndpoint + 'trainerlevels');
  };

  return adminSvc;
};
