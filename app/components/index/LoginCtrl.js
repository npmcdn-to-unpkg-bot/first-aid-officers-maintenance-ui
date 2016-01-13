'use strict';

module.exports = function ($rootScope, $location, AuthenticationSvc, ngDialog, $window) {
	var vm = this;

	(function initController() {
		AuthenticationSvc.ClearCredentials();
	})();

	function login() {
		vm.busy = true;
		AuthenticationSvc.Login(vm.username, vm.password, function (data) {
			vm.busy = false;
			AuthenticationSvc.SetCredentials(vm.username, vm.password, data);
			$window.location.reload();
			ngDialog.closeAll();
		}, function () {
			vm.busy = false;
			$rootScope.alerts.push({ type: 'danger', msg: '<strong>&Eacute;chec d\'authentification</strong>&nbsp;: ' +
				'Le matricule et/ou le mot de passe que vous avez entr&eacute; est invalide.<br />' +
				'En cas d\'&eacute;checs r&eacute;p&eacute;t&eacute;s, votre identifiant sera <u>invalid&eacute; temporairement</u>.' });
			vm.password = '';
		});
	}

	vm.login = login;
};