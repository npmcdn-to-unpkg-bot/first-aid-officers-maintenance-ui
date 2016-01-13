'use strict';
/*jshint camelcase: false*/

var _ = require('underscore');

module.exports = function ($scope, $rootScope, adminSvc, ngDialog) {
	$scope.empl = $rootScope.currentUser.info;
	adminSvc.getAvailableRoles().then(function (roles) {
		$scope.availableRoles = roles;
		$scope.userRoles = _.each(roles, function (role) {
			return role.checked = _.contains($rootScope.currentUser.info.roles, role.role_name), role;
		});
	});

	$scope.check = function (input) {
		input.form.password_confirm.$setValidity(false);
		if (document.getElementById('password_confirm').value !== document.getElementById('password').value) {
			document.getElementById('password_confirm').$setValidity(false);
		} else {
			input.setCustomValidity('');
		}
	};

	$scope.changePassword = function () {
		ngDialog.openConfirm({
			template: 'components/dialogs/warning.html',
			scope: $scope.$new(),
			controller: ['$rootScope', '$scope', 'AdminSvc', 'AuthenticationSvc', '$location', function ($rootScope, $scope, adminSvc, auth, $location) {
				$scope.innerHtml = '<div class="text-center">' +
					'<p>&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">modifier votre mot de passe</span>&nbsp;?<hr />' +
					'Cette action est irr&eacute;versible et prend effet imm&eacute;diatement. En confirmant, <span class="text-warning">vous serez d&eacute;connect&eacute(e)</span> et devrez vous identifier en utilisant votre nouveau mot de passe.</p>' +
					'</div>';
				$scope.confirm = function () {
					adminSvc.setPassword($scope.password_current, $scope.password).then(function () {
						$location.path('/home');
						auth.ClearCredentials();
						$rootScope.alerts.push({type: 'success', msg: 'Mot de passe modifi&eacute;.'});
					}, function () {
						$rootScope.alerts.push({type: 'danger', msg: 'Mot de passe actuel erron&eacute;.'});
					});

					$scope.closeThisDialog();
				};
			}]
		});
	};
};
