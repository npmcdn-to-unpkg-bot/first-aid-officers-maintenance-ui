'use strict';

module.exports = function ($scope, $location){
	$scope.isActive = function (viewLocation) {
		return viewLocation === '/' ? viewLocation === $location.path() : $location.path().indexOf(viewLocation) === 0;
	};
};