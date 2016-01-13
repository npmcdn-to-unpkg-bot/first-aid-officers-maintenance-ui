'use strict';
/*jshint camelcase: false*/

var _ = require('underscore');
var moment = require('moment');

module.exports = function ($scope, $rootScope, $routeParams, dataSvc, trngSvc, $location, dialog, busySvc) {
	busySvc.busy();

	Promise.all([dataSvc.getTraining($routeParams.trng_pk), dataSvc.getTrainingTypes(), dataSvc.getCertificates()]).then(function(results) {
		$scope.trng = results[0];
		$scope.trng.type = results[1][results[0].trng_trty_fk];
		$scope.trainees = _.values(results[0].trainees);
		$scope.certificates = _.values(results[2]);
		$scope.trng.expirationDate = moment($scope.trng.trng_date).add($scope.trng.type.trty_validity, 'months').format('YYYY-MM-DD');
		$scope.trng.validity = moment.duration($scope.trng.type.trty_validity, 'months').asYears();
		busySvc.done();
		$scope.$apply();
	});

	$scope.selectEmployee = function (empl_pk) {
		$location.path('/employees/' + empl_pk);
	};

	$scope.edit = function () {
		$location.path('/management/trainings/edit/' + $scope.trng.trng_pk);
	};

	$scope.complete = function () {
		$location.path('/trainings/' + $scope.trng.trng_pk + '/complete');
	};

	$scope.delete = function () {
		var dialogScope = $scope.$new(true);
		dialogScope.innerHtml = '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">supprimer d&eacute;finitivement</span> cette formation&nbsp? Cette op&eacute;ration est irr&eacute;versible et prend effet imm&eacute;diatement.';
		dialog.openConfirm({
			template: 'components/dialogs/warning.html',
			scope: dialogScope
		}).then(function () {
			trngSvc.deleteTraining($scope.trng.trng_pk).then(function () {
				$rootScope.alerts.push({type: 'success', msg: 'Formation effac&eacute;e.'});
				$location.path('/trainings');
			});
		});
	};
};
