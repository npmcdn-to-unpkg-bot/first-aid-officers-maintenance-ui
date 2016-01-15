'use strict';
/*jshint camelcase: false*/

module.exports = function ($rootScope, $scope, updateSvc, ngDialog, $route) {
	$scope.create = function () {
		var dialogScope = $scope.$new(false);
		dialogScope.innerHtml = '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">modifier</span> le site<br /><span class="text-warning">' + $scope.site.site_name + '</span>&nbsp;? Cette op&eacute;ration est irr&eacute;versible et prend effet imm&eacute;diatement.';
		ngDialog.openConfirm({
			template: 'components/dialogs/warning.html',
			scope: dialogScope
		}).then(function () {
			$scope.busy = true;
			updateSvc.createSite($scope.site.site_pk, $scope.site.site_name, $scope.site.dept.dept_pk, $scope.site.new_pk).then(function () {
				$rootScope.alerts.push({type: 'success', msg: 'Site <b>' + $scope.site.site_name + '</b> mis &agrave; jour.'});
				$scope.closeThisDialog();
				$route.reload();
			});
		});
	};

	$scope.delete = function () {
		var dialogScope = $scope.$new(false);
		dialogScope.innerHtml = '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">supprimer</span> le site<br /><span class="text-warning">' + $scope.site.site_name + '</span>&nbsp;? Cette op&eacute;ration est irr&eacute;versible et prend effet imm&eacute;diatement.';
		ngDialog.openConfirm({
			template: 'components/dialogs/warning.html',
			scope: dialogScope
		}).then(function () {
			$scope.busy = true;
			updateSvc.deleteSite($scope.site.site_pk).then(function () {
				$rootScope.alerts.push({type: 'success', msg: 'Site <b>' + $scope.site.site_name + '</b> supprim&eacute;.'});
				$scope.closeThisDialog();
				$route.reload();
			});
		});
	};
};
