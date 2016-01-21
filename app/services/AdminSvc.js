'use strict';
/*jshint camelcase: false*/

var _ = require('underscore');

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

	adminSvc.getUserRoles = function (empl_pk) {
		var deferred = $q.defer();
  		Promise.all([adminSvc.getAvailableRoles(), apiSvc.get(apiSvc.adminEndpoint + 'users/' + empl_pk)]).then(function (results) {
			deferred.resolve(_.each(results[0], function (role) {
				return role.checked = _.contains(results[1].roles, role.role_name), role;
  			}));
  		});

  		return deferred.promise;
	};

	adminSvc.setUserRoles = function (empl_pk, roles) {
		return $http.put(apiSvc.adminEndpoint + 'users/' + empl_pk + '/roles', roles);
	};

	adminSvc.getAvailableRoles = function () {
		return apiSvc.get(apiSvc.accountEndpoint + 'roles');
	};

	return adminSvc;
};