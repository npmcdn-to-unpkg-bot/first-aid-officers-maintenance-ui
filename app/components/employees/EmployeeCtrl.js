'use strict';
/*jshint camelcase: false*/

var _ = require('underscore');

module.exports = function ($rootScope, $scope, $routeParams, dataSvc, adminSvc, $location, ngDialog, $route, busySvc) {
	busySvc.busy();

	Promise.all([dataSvc.getEmployee($routeParams.empl_pk), dataSvc.getEmployeeTrainings($routeParams.empl_pk), dataSvc.getTrainingTypes(), dataSvc.getCertificates(), dataSvc.getEmployeeSite($routeParams.empl_pk)]).then(function (results) {
		$scope.empl = results[0];
		$scope.source = _.values(results[1]);
		_.each($scope.source, function (training) {
			training.type = results[2][training.trng_trty_fk];
		});
		$scope.certificates = _.values(results[3]);
		$scope.site = results[4];
		if($scope.empl.empl_pk !== $rootScope.currentUser.info.empl_pk) {
			adminSvc.getUserInfo($scope.empl.empl_pk).then(function (info) {
				$scope.canResetPassword = _.contains(info.roles, 'user');
			});
		}

		busySvc.done();
		$scope.$apply();
	});

	$scope.$watch('viewEmpl', function (viewEmpl) {
		if(viewEmpl !== undefined && viewEmpl.empl_pk) {
			$scope.select(viewEmpl.empl_pk);
			delete($scope.viewEmpl);
		}
	});

	$scope.editRoles = function () {
		adminSvc.getUserRoles($scope.empl.empl_pk).then(function (roles) {
			var dialogScope = $scope.$new(false);
			dialogScope.roles = _.object(_.pluck(roles, 'role_name'), roles);
			dialogScope.callback = function (empl) {
				$route.reload();
				if(empl.empl_pk === $rootScope.currentUser.info.empl_pk) {
					adminSvc.getInfo().then(null, function () {
						ngDialog.openConfirm({
							template: 'components/dialogs/locked_out.html'
						}).then(function () {
							$rootScope.disconnect();
						});
					});
				}
			};

			ngDialog.open({
				template: 'components/dialogs/roles_edit/roles_edit.html',
				scope: dialogScope,
				controller: 'RolesEditCtrl'
			});
		});
	};

	$scope.resetPassword = function () {
		var dialogScope = $scope.$new(true);
		dialogScope.innerHtml = '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">r&eacute;initialiser le mot de passe</span> de cet agent&nbsp;? Cette modification est irr&eacute;versible et prend effet imm&eacute;diatement.';
		ngDialog.openConfirm({
			template: 'components/dialogs/warning.html',
			scope: dialogScope
		}).then(function () {
			adminSvc.resetUserPassword($scope.empl.empl_pk).then(function (password) {
				$rootScope.alerts.push({type: 'success', msg: 'Mot de passe r&eacute;initialis&eacute;&nbsp: <strong><samp>' + password + '</samp></strong><hr />Veuillez transmettre son nouveau mot de passe &agrave; l\'agent concern&eacute;.'});
			});
		});
	};

	$scope.selectTraining = function(trng_pk) {
		$location.path('/trainings/' + trng_pk);
	};

	$scope.select = function(empl_pk) {
		$location.path('/employees/' + empl_pk);
	};
};