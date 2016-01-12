'use strict';
/*jshint camelcase: false*/

var _ = require('underscore');

module.exports = function ($http, $q, $rootScope, apiSvc, $filter) {

	var dataSvc = {};
	var dateFilter = $filter('date');

	dataSvc.getDepartments = function() {
		return apiSvc.get(apiSvc.resourcesByKeysEndpoint + 'departments');
	};

	dataSvc.getEmployee = function(empl_pk) {
		var deferred = $q.defer();
		Promise.all([apiSvc.get(apiSvc.resourcesEndpoint + 'employees/' + empl_pk), apiSvc.get(apiSvc.statisticsEndpoint + 'employees/' + empl_pk)]).then(function (results) {
			var res = results[0];
			res.stats = _.first(_.values(results[1]));
			deferred.resolve(res);
		});

		return deferred.promise;
	};

	dataSvc.getSite = function(site_pk) {
		return apiSvc.get(apiSvc.resourcesEndpoint + 'sites/' + site_pk);
	};

	dataSvc.getSiteWithStats = function(site_pk) {
		var deferred = $q.defer();
		Promise.all([apiSvc.get(apiSvc.resourcesEndpoint + 'sites/' + site_pk), apiSvc.get(apiSvc.statisticsEndpoint + 'sites/' + site_pk)]).then(function (results) {
			var res = results[0];
			res.stats = _.first(_.values(results[1]));
			deferred.resolve(res);
		});

		return deferred.promise;
	};

	dataSvc.getSiteEmployees = function(site_pk) {
		return apiSvc.get(apiSvc.resourcesByKeysEndpoint + 'employees?site=' + site_pk);
	};

	dataSvc.getSiteEmployeesWithStats = function(site_pk) {
		var deferred = $q.defer();
		Promise.all([apiSvc.get(apiSvc.resourcesByKeysEndpoint + 'employees?site=' + site_pk), apiSvc.get(apiSvc.statisticsEndpoint + 'employees?site=' + site_pk)]).then(function (results) {
			var res = results[0];
			_.each(_.first(_.values(results[1])), function (stats, empl_pk) {
				res[empl_pk].stats = stats;
			});

			deferred.resolve(res);
		});

		return deferred.promise;
	};

	dataSvc.getSites = function() {
		return apiSvc.get(apiSvc.resourcesByKeysEndpoint + 'sites');
	};

	dataSvc.getAllSites = function() {
		return apiSvc.get(apiSvc.resourcesByKeysEndpoint + 'sites?unlisted=true');
	};

	dataSvc.getSitesWithStats = function() {
		var deferred = $q.defer();
		Promise.all([dataSvc.getSites(), apiSvc.get(apiSvc.statisticsEndpoint + 'sites')]).then(function (results) {
			var res = results[0];
			_.each(_.first(_.values(results[1])), function (stats, site_pk) {
				res[site_pk].stats = stats;
			});

			deferred.resolve(res);
		});

		return deferred.promise;
	};

	dataSvc.getEmployees = function() {
		return apiSvc.get(apiSvc.resourcesByKeysEndpoint + 'employees');
	};

	dataSvc.getEmployeesWithStats = function() {
		var deferred = $q.defer();
		Promise.all([dataSvc.getEmployees(), apiSvc.get(apiSvc.statisticsEndpoint + 'employees')]).then(function (results) {
			var res = results[0];
			_.each(_.first(_.values(results[1])), function (stats, empl_pk) {
				res[empl_pk].stats = stats;
			});

			deferred.resolve(res);
		});

		return deferred.promise;
	};

	dataSvc.getEmployeeTrainings = function(empl_pk) {
		return apiSvc.get(apiSvc.resourcesByKeysEndpoint + 'trainings?employee=' + empl_pk, 'employees[\'' + empl_pk + '\'].trainings');
	};

	dataSvc.getCertificates = function() {
		return apiSvc.get(apiSvc.resourcesByKeysEndpoint + 'certificates');
	};

	dataSvc.getTrainingTypes = function() {
		var deferred = $q.defer();
		Promise.all([apiSvc.get(apiSvc.resourcesByKeysEndpoint + 'trainingtypes'), apiSvc.get(apiSvc.resourcesByKeysEndpoint + 'trainingtypes_certificates'), dataSvc.getCertificates()]).then(function (results) {
			var res = results[0];
			_.each(results[1], function (certificates, trty_pk) {
				res[trty_pk].certificates = _.map(certificates, function (cert_pk) {
					return results[2][cert_pk];
				});
			});

			deferred.resolve(res);
		});

		return deferred.promise;
	};

	dataSvc.getTrainings = function() {
		var deferred = $q.defer();
		apiSvc.get(apiSvc.resourcesByKeysEndpoint + 'trainings').then(function (trainings) {
			_.each(_.values(trainings), function (training) {
				training.trng_displayDate = dateFilter(training.trng_date, 'fullDate');
			});

			deferred.resolve(trainings);
		});

		return deferred.promise;
	};

	dataSvc.getTraining = function(trng_pk) {
		var deferred = $q.defer();
		Promise.all([apiSvc.get(apiSvc.resourcesEndpoint + 'trainings/' + trng_pk), apiSvc.get(apiSvc.resourcesByKeysEndpoint + 'employees?training=' + trng_pk)]).then(function(results) {
			var res = results[0];
			res.trainees = results[1];
			deferred.resolve(res);
		});

		return deferred.promise;
	};

	return dataSvc;
};