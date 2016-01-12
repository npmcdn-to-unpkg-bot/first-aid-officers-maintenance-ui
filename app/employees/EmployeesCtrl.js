'use strict';
/*jshint camelcase: false*/

var _ = require('underscore');

module.exports = function ($scope, $location, dataSvc) {
	$scope.stats = 'loading';

	$scope.select = function (empl_pk) {
		$location.path('/employees/' + empl_pk);
	};

	$scope.selectSite = function (site_pk) {
		$location.path('/sites/' + site_pk);
	};

	Promise.all([dataSvc.getCertificates(), dataSvc.getSites()]).then(function (results) {
		$scope.certificates = _.values(results[0]);
		$scope.sites = results[1];
		dataSvc.getEmployeesWithStats().then(function (employees) {
			_.each(employees, function (empl) {
				empl.site = $scope.sites[empl.siem_site_fk];
			});

			$scope.employees = _.values(employees);
			$scope.stats = 'done';
		});
	});
};
