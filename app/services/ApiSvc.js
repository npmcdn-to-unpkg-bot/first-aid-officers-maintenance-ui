'use strict';

module.exports = function ($http, $q) {
  var apiSvc = {};

  var requestOptions = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  apiSvc.apiBaseUrl = /*apiurl:start*/ 'http://localhost:8080/api/' /*apiurl:end*/ ;
  if (!apiSvc.apiBaseUrl.endsWith('/')) {
    apiSvc.apiBaseUrl += '/';
  }

  apiSvc.authEndpoint = apiSvc.apiBaseUrl + 'auth/';
  apiSvc.adminEndpoint = apiSvc.apiBaseUrl + 'admin/';
  apiSvc.accountEndpoint = apiSvc.apiBaseUrl + 'account/';
  apiSvc.certificatesEndpoint = apiSvc.apiBaseUrl + 'certificates/';
  apiSvc.employeesNotesEndpoint = apiSvc.apiBaseUrl + 'employees-notes/';
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
      deferred.reject(url + '\nError: request returned status ' + status);
    });

    return deferred.promise;
  };

  apiSvc.post = function (url, data) {
    var deferred = $q.defer();
    $http.post(encodeURI(url), JSON.stringify(data || {}), requestOptions).success(function (data) {
      deferred.resolve(data);
    }).error(function (data, status) {
      deferred.reject(url + '\nError: request returned status ' + status);
    });

    return deferred.promise;
  };

  apiSvc.put = function (url, data) {
    var deferred = $q.defer();
    $http.put(encodeURI(url), JSON.stringify(data || {}), requestOptions).success(function (data) {
      deferred.resolve(data);
    }).error(function (data, status) {
      deferred.reject(url + '\nError: request returned status ' + status);
    });

    return deferred.promise;
  };

  apiSvc.delete = function (url) {
    var deferred = $q.defer();
    $http.delete(encodeURI(url)).success(function (data) {
      deferred.resolve(data);
    }).error(function (data, status) {
      deferred.reject(url + '\nError: request returned status ' + status);
    });

    return deferred.promise;
  };

  return apiSvc;
};
