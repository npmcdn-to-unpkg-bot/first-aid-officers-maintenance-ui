'use strict';

module.exports = function ($scope, ngDialog) {
	$scope.login = function () {
		ngDialog.closeAll();
		ngDialog.open({
			template: 'components/index/login.html',
			controller: 'LoginCtrl',
			controllerAs: 'vm'
		});
	};

	return this;
};