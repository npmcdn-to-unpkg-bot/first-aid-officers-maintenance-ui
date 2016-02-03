'use strict';
/*jshint camelcase: false*/

module.exports = function ($rootScope, $scope, updateSvc, ngDialog, $route) {
	$scope.create = function () {
		var dialogScope = $scope.$new(false);
		dialogScope.innerHtml = '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">modifier</span> le d&eacute;partement<br /><span class="text-warning">' + $scope.dept.dept_name + '</span>&nbsp;? Cette op&eacute;ration est irr&eacute;versible et prend effet imm&eacute;diatement.';
		ngDialog.openConfirm({
			template: 'components/dialogs/warning.html',
			scope: dialogScope
		}).then(function () {
			$scope.busy = true;
			updateSvc.createDept($scope.dept.dept_pk, $scope.dept.dept_name, $scope.dept.dept_id).then(function () {
				$rootScope.alerts.push({type: 'success', msg: 'D&eacute;partement <b>' + $scope.dept.dept_name + '</b> mis &agrave; jour.'});
				$scope.closeThisDialog();
				$route.reload();
			});
		});
	};
};
