'use strict';

var _ = require('underscore');
/*jshint camelcase: false*/

module.exports = function ($rootScope, $scope, $document, $location, ngDialog, dataSvc) {
	$scope.whereami = $location.host();
	$scope.title = $document[0].title;
	$scope.today = new Date();

	Promise.all([dataSvc.getSites(), dataSvc.getEmployees()]).then(function (results) {
		$scope.globalIndex = _.values(results[0]).concat(_.values(results[1]));
	});

	$rootScope.$watch('currentUser.info', function (userInfo) {
		$scope.userInfo = userInfo;
	}, true);
	$scope.$watch('select', function (select) {
		if(select !== undefined) {
			if(select.site_pk) {
				$location.path('/sites/' + select.site_pk);
				delete($scope.select);
			} else if(select.empl_pk) {
				$location.path('/employees/' + select.empl_pk);
				delete($scope.select);
			}
		}
	});

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