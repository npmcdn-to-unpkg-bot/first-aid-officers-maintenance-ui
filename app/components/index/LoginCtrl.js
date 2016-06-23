'use strict';

module.exports = function ($scope, $rootScope, $route, authSvc, busySvc) {
  function success() {
    $scope.closeThisDialog();
    busySvc.done('auth-pending');
    $rootScope.currentUser.info = authSvc.getInfo();
    $rootScope.$broadcast('update');
    $route.reload();
  }

  function error() {
    busySvc.done('auth-pending');
    $scope.$emit('alert', {
      type: 'danger',
      msg: '<strong>&Eacute;chec d\'authentification</strong>&nbsp;: ' +
        'Le matricule et/ou le mot de passe que vous avez entr&eacute; est invalide.<br />' +
        'En cas d\'&eacute;checs r&eacute;p&eacute;t&eacute;s, votre identifiant sera <u>invalid&eacute; temporairement</u>.'
    });
  }

  $scope.login = function (username, password) {
    busySvc.busy('auth-pending', true);
    authSvc.authenticate(username, password).then(success, error);
  };
};
