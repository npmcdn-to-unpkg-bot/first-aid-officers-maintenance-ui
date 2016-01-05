'use strict';

module.exports = function ($scope, ngDialog) {
	$scope.openDialog = function () {
		ngDialog.closeAll();
		var dialogScope = $scope.$new(true);
		dialogScope.name = $scope.name;
		ngDialog.open({
			template: 'view1/dialog.html',
			scope: dialogScope
		});
	};
};