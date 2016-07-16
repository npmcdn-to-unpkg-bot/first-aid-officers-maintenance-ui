'use strict';
/*jshint camelcase: false*/

module.exports = function ($http, $q, apiSvc) {

  var adminSvc = {};

  adminSvc.resetUserPassword = function (user_id) {
    return apiSvc.delete(apiSvc.adminEndpoint + 'users/' + user_id + '/password');
  };

  adminSvc.setPassword = function (pwd_current, pwd_new) {
    return apiSvc.put(apiSvc.accountEndpoint + 'password', {
      pwd_current: pwd_current,
      pwd_new: pwd_new
    });
  };

  adminSvc.getInfo = function () {
    return Promise.all([apiSvc.get(apiSvc.accountEndpoint), apiSvc.get(apiSvc.accountEndpoint + 'trainerprofile')]).then(function (results) {
      var user = results[0];
      if (user.roles['trainer'] !== undefined) { // jshint ignore: line
        user.roles['trainer'] = results[1]; // jshint ignore: line
      }

      return user;
    });
  };

  adminSvc.getUsers = function () {
    return apiSvc.get(apiSvc.adminEndpoint + 'users/');
  };

  adminSvc.changeId = function (user_id, new_id) {
    return apiSvc.put(apiSvc.adminEndpoint + 'users/' + user_id + '/' + new_id);
  };

  adminSvc.changeOwnId = function (new_id) {
    return apiSvc.put(apiSvc.accountEndpoint + 'id/' + new_id);
  };

  adminSvc.getUserInfo = function (user_id) {
    return apiSvc.get(apiSvc.adminEndpoint + 'users/' + user_id);
  };

  adminSvc.updateUser = function (user_id, data) {
    return $http.put(apiSvc.adminEndpoint + 'users/' + user_id, data);
  };

  adminSvc.createUser = function (user_id, data) {
    return $http.post(apiSvc.adminEndpoint + 'users/' + user_id, data);
  };

  adminSvc.deleteUser = function (user_id) {
    return $http.delete(apiSvc.adminEndpoint + 'users/' + user_id);
  };

  adminSvc.getTrainerProfiles = function () {
    return apiSvc.get(apiSvc.adminEndpoint + 'trainerprofiles');
  };

  adminSvc.postTrainerProfile = function (trainerProfile) {
    return apiSvc.post(apiSvc.adminEndpoint + 'trainerprofiles', trainerProfile);
  };

  adminSvc.putTrainerProfile = function (trlv_pk, trainerProfile) {
    return apiSvc.put(apiSvc.adminEndpoint + 'trainerprofiles/' + trlv_pk, trainerProfile);
  };

  adminSvc.deleteTrainerProfile = function (trlv_pk) {
    return apiSvc.delete(apiSvc.adminEndpoint + 'trainerprofiles/' + trlv_pk);
  };

  return adminSvc;
};
