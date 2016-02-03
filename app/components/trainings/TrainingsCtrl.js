'use strict';
/*jshint camelcase: false*/

var _ = require('underscore');
module.exports = function ($scope, dataSvc, $location, busySvc) {
	busySvc.busy();

	Promise.all([dataSvc.getTrainings(), dataSvc.getTrainingTypes(), dataSvc.getCertificates()]).then(function (results) {
		$scope.trainings = _.values(results[0]);
		_.each($scope.trainings, function (training) {
			training.type = results[1][training.trng_trty_fk];
		});

		$scope.certificates = results[2];
		busySvc.done();
		$scope.$apply();
	});

	$scope.select = function(trng_pk) {
		$location.path('/trainings/' + trng_pk);
	};
};
