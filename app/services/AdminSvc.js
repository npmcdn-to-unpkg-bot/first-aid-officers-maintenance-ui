'use strict';
/*jshint camelcase: false*/

var _ = require('underscore');

module.exports = function ($http, $q, $rootScope, apiSvc) {

	var adminSvc = {};

	adminSvc.resetUserPassword = function (empl_pk) {
		var deferred = $q.defer();
		$http.delete(apiSvc.adminEndpoint + 'users/' + empl_pk + '/password').success(function (data) {
			deferred.resolve(data);
		}).error(function (data, status) {
			deferred.reject('Error: request returned status ' + status); 
		});
		
		return deferred.promise;
	};

	adminSvc.setPassword = function (pwd_current, pwd_new) {
		var deferred = $q.defer();
		$http.put(apiSvc.accountEndpoint + 'password', JSON.stringify({ pwd_current: pwd_current, pwd_new: pwd_new })).success(function (data) {
			deferred.resolve(data);
		}).error(function (data, status) {
			deferred.reject('Error: request returned status ' + status); 
		});
		
		return deferred.promise;
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