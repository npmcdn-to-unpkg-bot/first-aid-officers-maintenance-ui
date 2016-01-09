'use strict';
/*jshint camelcase: false*/

var _ = require('underscore');

module.exports = function ($scope, $routeParams, $location, dataSvc) {
	$scope.stats = 'loading';

	$scope.selectEmployee = function (empl_pk) {
		$location.path('/employees/' + empl_pk);
	};

	$scope.select = function (site_pk) {
		$location.path('/sites/' + site_pk);
	};

	dataSvc.getSites().then(function (sites) {
		$scope.sites = _.values(sites);
	});
	
	dataSvc.getSiteEmployeesWithStats($routeParams.site_pk).then(function (employees) {
		$scope.employees = _.values(employees);
		$scope.stats = 'done';
	});

	dataSvc.getSiteWithStats($routeParams.site_pk).then(function (site) {
		$scope.site = site;
		dataSvc.getCertificates().then(function (certificates) {
			$scope.certificates = _.values(certificates);
		});
	});
};