'use strict';
/*jshint camelcase: false*/

var _ = require('underscore');

module.exports = function ($scope, $routeParams, $location, dataSvc, busySvc) {
	busySvc.busy();

	Promise.all([dataSvc.getSiteEmployeesWithStats($routeParams.site_pk), dataSvc.getSiteWithStats($routeParams.site_pk), dataSvc.getCertificates()]).then(function (results) {
		$scope.employees = _.values(results[0]);
		$scope.site = results[1];
		$scope.certificates = _.values(results[2]);
		busySvc.done();
		$scope.$apply();
	});

	$scope.selectEmployee = function (empl_pk) {
		$location.path('/employees/' + empl_pk);
	};

	$scope.select = function (site_pk) {
		$location.path('/sites/' + site_pk);
	};
};