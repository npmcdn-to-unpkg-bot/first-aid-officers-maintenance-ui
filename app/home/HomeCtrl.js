'use strict';

module.exports = function ($scope, ngDialog) {
	$scope.login = function () {
		ngDialog.closeAll();
		ngDialog.open({
			template: 'index/login.html',
			controller: 'LoginCtrl',
			controllerAs: 'vm'
		});
	};

	return this;
};