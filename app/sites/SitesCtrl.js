'use strict';
/*jshint camelcase: false*/

var _ = require('underscore');

module.exports = function ($scope, $location, dataSvc) {
	$scope.stats = 'loading';

	$scope.search = function (site) {
		return site.site_name.contains($scope.filter) || site.dept.dept_name.contains($scope.filter);
	};

	$scope.select = function (site_pk) {
		$location.path('/sites/' + site_pk);
	};

	Promise.all([dataSvc.getDepartments(), dataSvc.getCertificates()]).then(function (results) {
		$scope.departments = results[0];
		$scope.certificates = _.values(results[1]);
		dataSvc.getSitesWithStats().then(function (sites) {
			$scope.sites = _.each(_.values(sites), function (site) {
				site.dept = $scope.departments[site.site_dept_fk];
			});

			$scope.stats = 'done';
		});
	});
};