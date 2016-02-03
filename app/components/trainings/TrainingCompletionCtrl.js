'use strict';
/*jshint camelcase: false*/

var _ = require('underscore');
var moment = require('moment');

module.exports = function ($scope, $rootScope, $routeParams, dataSvc, $location, ngDialog, trainingsSvc, busySvc) {
	busySvc.busy();

	Promise.all([dataSvc.getTraining($routeParams.trng_pk), dataSvc.getTrainingTypes(), dataSvc.getCertificates()]).then(function(results) {
		$scope.trng = results[0];
		$scope.firstTime = ($scope.trng.trng_outcome === 'SCHEDULED');
		$scope.trng.type = results[1][results[0].trng_trty_fk];
		$scope.trainees = _.values(results[0].trainees);
		$scope.certificates = _.values(results[2]);
		$scope.trng.expirationDate = moment($scope.trng.trng_date).add($scope.trng.type.trty_validity, 'months').format('YYYY-MM-DD');
		$scope.trng.validity = moment.duration($scope.trng.type.trty_validity, 'months').asYears();
		busySvc.done();
		$scope.$apply();
	});

	$scope.validateAll = function () {
		_.each($scope.trainees, function (trainee) {
			trainee.validated = true;
		});
	};

	$scope.save = function () {
		var dialogScope = $scope.$new(true);
		var highlighted = $scope.firstTime ? '&eacute;diter le' : 'enregistrer les modifications apport&eacute;es au';
		dialogScope.innerHtml = '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning"> ' + highlighted + ' Proc&egrave;s&nbsp;Verbal</span> de cette formation&nbsp?';
		ngDialog.openConfirm({
			template: 'components/dialogs/warning.html',
			scope: dialogScope
		}).then(function () {
			trainingsSvc.updateTraining($scope.trng.trng_pk, {
				trng_trty_fk: $scope.trng.type.trty_pk,
				trng_date: $scope.trng.trng_date,
				trng_outcome: 'COMPLETED',
				trainees: _.each($scope.trng.trainees, function (trainee) {
					trainee.trem_outcome = trainee.validated ? 'VALIDATED' : 'FLUNKED';
				})
			}).then(function () {
				$rootScope.alerts.push({type: 'success', msg: 'Proc&egrave;s verbal de fin de session &eacute;dit&eacute;.'});
				$location.path('/trainings/' + $scope.trng.trng_pk);
			});
		});
	};

	$scope.cancel = function () {
		var dialogScope = $scope.$new(true);
		var highlighted = $scope.firstTime ? 'l\'&eacute;dition' : 'la modification';
		dialogScope.innerHtml = '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">annuler ' + highlighted + ' du Proc&egrave;s&nbsp;Verbal</span> de cette formation&nbsp?<hr />En confirmant, toutes les modifications qui n\'ont pas &eacute;t&eacute; sauvegard&eacute;es seront perdues.';
		ngDialog.openConfirm({
			template: 'components/dialogs/warning.html',
			scope: dialogScope
		}).then(function () {
			window.history.back();
		});
	};
};
