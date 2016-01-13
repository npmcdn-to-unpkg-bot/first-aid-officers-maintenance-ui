'use strict';

module.exports = function ($http, $q) {
	var apiSvc = {};
	
	apiSvc.apiBaseUrl = 'http://192.168.0.15:8080/api/';
	//apiSvc.apiBaseUrl = 'http://nclsdevelopment.duckdns.org/api/';

	apiSvc.authEndpoint = apiSvc.apiBaseUrl + 'auth/';
	apiSvc.adminEndpoint = apiSvc.apiBaseUrl + 'admin/';
	apiSvc.accountEndpoint = apiSvc.apiBaseUrl + 'account/';
	apiSvc.resourcesEndpoint = apiSvc.apiBaseUrl + 'resources/';
	apiSvc.resourcesByKeysEndpoint = apiSvc.apiBaseUrl + 'resources-by-keys/';
	apiSvc.statisticsEndpoint = apiSvc.apiBaseUrl + 'statistics/';
	apiSvc.trainingsEndpoint = apiSvc.apiBaseUrl + 'trainings/';
	apiSvc.updateEndpoint = apiSvc.apiBaseUrl + 'update/';

	apiSvc.get = function (url) {
		var deferred = $q.defer();
		$http.get(encodeURI(url)).success(function (data) {
			deferred.resolve(data);
		}).error(function (data, status) {
			deferred.reject('Error: request returned status ' + status); 
		});
		
		return deferred.promise;
	};

	return apiSvc;
};