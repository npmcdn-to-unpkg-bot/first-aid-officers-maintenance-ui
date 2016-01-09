'use strict';

var _ = require('underscore');

module.exports = function ($rootScope, $scope, $document, $location, ngDialog) {
	$scope.whereami = $location.host();
	$scope.title = $document[0].title;
	$scope.today = new Date();
	$rootScope.$watch('currentUser.info', function (userInfo) {
		$scope.userInfo = userInfo;
	}, true);

	$scope.isActive = function (viewLocation) {
		return viewLocation === '/' ? viewLocation === $location.path() : $location.path().indexOf(viewLocation) === 0;
	};

	$scope.disconnect = function () {
		var dialogScope = $scope.$new(false);
		dialogScope.innerHtml = '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">vous d&eacute;connecter</span>&nbsp;?';
		ngDialog.closeAll();
		ngDialog.openConfirm({
			template: 'dialogs/warning.html',
			scope: dialogScope
		}).then(function () {
			$rootScope.disconnect();
		});
	};

	$scope.closeAlert = function(index) {
		$scope.alerts.splice(index, 1);
	};

	$scope.onLocation = function (location) {
		if(location instanceof Array) {
			return _.some(location, function (current) {
				return $location.path() === current;
			});
		}

		return $location.path() === location;
	};
};