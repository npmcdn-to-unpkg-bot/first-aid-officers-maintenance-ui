'use strict';
/*jshint camelcase: false*/

var _ = require('underscore');

module.exports = function ($rootScope, $scope, adminSvc, ngDialog) {
  $scope.isDisabled = function (role) {
    return ($scope.empl === undefined || $scope.empl.empl_pk === undefined) || (role.role_name !== 'user' && !$scope.roles.user.checked);
  };

  $scope.roleClicked = function (role) {
    if (!role.checked && role.role_name === 'user') {
      _.each($scope.roles, function (other) {
        if (other.role_name !== 'user') {
          other.checked = false;
        }
      });
    }
  };

  $scope.updateRoles = function () {
    var dialogScope = $scope.$new(true);
    dialogScope.innerHtml =
      '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">modifier les privil&egrave;ges</span> de cet utilisateur&nbsp;? En confirmant, cette mise &agrave; jour prendra effet imm&eacute;diatement.';
    ngDialog.openConfirm({
      template: 'components/dialogs/warning.html',
      scope: dialogScope
    }).then(function () {
      adminSvc.setUserRoles($scope.empl.empl_pk, _.pluck(_.where($scope.roles, { checked: true }), 'role_name')).then(function (response) {
        var type, message;
        switch (response.status) {
          case 200:
            type = 'success';
            message = 'Compte cr&eacute;&eacute;&nbsp;!<br />Un mot de passe a &eacute;t&eacute; automatiquement g&eacute;n&eacute;r&eacute;&nbsp;: <strong><samp>' +
              response.data + '</samp></strong><hr />Veuillez transmettre son nouveau mot de passe &agrave; l\'agent concern&eacute;.';
            break;

          case 204:
            type = 'success';
            message = 'Privil&egrave;ges de l\'utilisateur mis &agrave; jour.';
            break;

          default:
            type = 'danger';
            message = 'Une erreur inattendue s\'est produite.';
        }

        if ($scope.empl.empl_pk === $scope.currentUser.info.empl_pk) {
          adminSvc.getInfo().then(function (info) {
            $rootScope.currentUser.info = info;
          });
        }

        $rootScope.alerts.push({ type: type, msg: message, static: true });
        $scope.closeThisDialog();
        if ($scope.callback) {
          $scope.callback($scope.empl);
        }
      });
    });
  };
};
