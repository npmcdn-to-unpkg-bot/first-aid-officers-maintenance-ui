'use strict';

module.exports = function ($scope, $rootScope, $route, authSvc, busySvc) {
  busySvc.busy('auth');

  function success() {
    $scope.closeThisDialog();
    busySvc.done('auth', true);
    busySvc.done('auth-pending');
    $rootScope.currentUser.info = authSvc.getInfo();
    $route.reload();
  }

  function error() {
    busySvc.done('auth-pending');
    $rootScope.alerts.push({
      type: 'danger',
      msg: '<strong>&Eacute;chec d\'authentification</strong>&nbsp;: ' +
        'Le matricule et/ou le mot de passe que vous avez entr&eacute; est invalide.<br />' +
        'En cas d\'&eacute;checs r&eacute;p&eacute;t&eacute;s, votre identifiant sera <u>invalid&eacute; temporairement</u>.'
    });
  }

  $scope.login = function (username, password) {
    busySvc.busy('auth-pending');
    authSvc.authenticate(username, password).then(success, error);
  };
};
