'use strict';
/*jshint camelcase: false*/

var _ = require('underscore');

module.exports = function ($scope, $location, dataSvc, busySvc) {
	busySvc.busy();
	Promise.all([dataSvc.getDepartments(), dataSvc.getCertificates(), dataSvc.getSitesWithStats()]).then(function (results) {
		$scope.departments = results[0];
		$scope.certificates = _.values(results[1]);
		$scope.sites = _.each(_.values(results[2]), function (site) {
			site.dept = $scope.departments[site.site_dept_fk];
		});

		busySvc.done();
		$scope.$apply();
	});

	$scope.select = function (site_pk) {
		$location.path('/sites/' + site_pk);
	};
};