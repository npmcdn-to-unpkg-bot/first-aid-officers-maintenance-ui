'use strict';
/*jshint camelcase: false*/

var _ = require('underscore');
var clone = require('lodash/cloneDeep');

module.exports = function ($scope, dataSvc, ngDialog, $route, busySvc) {
	busySvc.busy();
	Promise.all([dataSvc.getAllSites(), dataSvc.getDepartments()]).then(function (results) {
		$scope.departments = results[1];
		$scope.sites = _.each(_.values(results[0]), function (site) {
			site.dept = $scope.departments[site.site_dept_fk];
		});

		busySvc.done();
		$scope.$apply();
	});

	$scope.create = function () {
		var dialogScope = $scope.$new(true);
		dialogScope.departments = $scope.departments;
		dialogScope.edit = false;

		ngDialog.open({
			template: 'components/dialogs/site_edit/site_edit.html',
			scope: dialogScope,
			controller: 'SiteCreationCtrl'
		});
	};

	$scope.editSite = function (site_pk) {
		var dialogScope = $scope.$new(true);
		dialogScope.departments = $scope.departments;
		dialogScope.site = clone(_.find($scope.sites, {site_pk: site_pk}));
		dialogScope.site.new_pk = dialogScope.site.site_pk;
		dialogScope.edit = true;

		ngDialog.open({
			template: 'components/dialogs/site_edit/site_edit.html',
			scope: dialogScope,
			controller: 'SiteEditCtrl'
		});
	};

	$scope.editDept = function (dept_pk) {
		var dialogScope = $scope.$new(true);
		dialogScope.dept = clone($scope.departments[dept_pk]);

		ngDialog.open({
			template: 'components/dialogs/department_edit/department_edit.html',
			scope: dialogScope,
			controller: 'DepartmentEditCtrl'
		});
	};
};
