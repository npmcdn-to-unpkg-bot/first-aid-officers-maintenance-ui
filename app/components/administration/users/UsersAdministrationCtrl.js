'use strict';
/*jshint camelcase: false*/

var _ = require('underscore');

module.exports = function ($rootScope, $scope, dataSvc, adminSvc, ngDialog, $route, $location, busySvc) {
  function updateUsersCount() {
    $scope.usersCount = _.filter($scope.users, function (user) {
      return _.contains(user.roles, 'user');
    }).length;
    $scope.adminsCount = _.filter($scope.users, function (user) {
      return _.contains(user.roles, 'admin');
    }).length;
    $scope.trainersCount = _.filter($scope.users, function (user) {
      return _.contains(user.roles, 'trainer');
    }).length;
  }

  function ownRolesChanged() {
    adminSvc.getInfo().then(function (updated) {
      if (!_.contains(updated.roles, 'admin')) {
        $route.reload();
        $location.path('/home');
      } else {
        $route.reload();
      }
    }, function () {
      ngDialog.openConfirm({
        template: 'components/dialogs/locked_out.html'
      }).then(function () {
        $rootScope.disconnect();
      });
    });
  }

  busySvc.busy();
  Promise.all([dataSvc.getEmployees(), adminSvc.getAvailableRoles(), adminSvc.getUsers()]).then(function (results) {
    $scope.employees = _.values(results[0]);
    $scope.roles = _.object(_.pluck(results[1], 'role_name'), results[1]);
    $scope.users = results[2];
    updateUsersCount();
    busySvc.done();
    $scope.$apply();
  }, function () {
    busySvc.done();
  });

  $scope.edit = function (user) {
    var dialogScope = $scope.$new(false);
    dialogScope.empl = user;
    _.each(dialogScope.roles, function (role) {
      role.checked = _.contains(user.roles, role.role_name);
    });

    dialogScope.callback = function () {
      if ($rootScope.currentUser.info.empl_pk === user.empl_pk) {
        ownRolesChanged();
      }

      adminSvc.getUserInfo(user.empl_pk).then(function (updated) {
        if (updated.roles.length === 0) {
          $scope.users = _.reject($scope.users, function (tmp) {
            return tmp.empl_pk === user.empl_pk;
          });
        } else {
          _.findWhere($scope.users, { empl_pk: user.empl_pk }).roles = updated.roles;
        }

        updateUsersCount();
      });
    };

    ngDialog.open({
      templateUrl: 'components/dialogs/roles_edit/roles_edit.html',
      scope: dialogScope,
      controller: 'RolesEditCtrl'
    });
  };

  $scope.resetPassword = function (empl) {
    var dialogScope = $scope.$new(true);
    dialogScope.innerHtml =
      '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">r&eacute;initialiser le mot de passe</span> de<br /><span class="text-warning">' + (empl.empl_gender ?
        'M.' : 'Mme') + '&nbsp;' + empl.empl_surname + '&nbsp;' + empl.empl_firstname +
      '</span>&nbsp;? Cette modification est irr&eacute;versible et prend effet imm&eacute;diatement.';
    ngDialog.openConfirm({
      template: 'components/dialogs/warning.html',
      scope: dialogScope
    }).then(function () {
      adminSvc.resetUserPassword(empl.empl_pk).then(function (password) {
        $scope.$emit('alert', {
          type: 'success',
          msg: 'Mot de passe r&eacute;initialis&eacute;&nbsp: <strong><samp>' + password +
            '</samp></strong><hr />Veuillez transmettre son nouveau mot de passe &agrave; l\'agent concern&eacute;.'
        });
      });
    });
  };

  $scope.create = function () {
    _.each($scope.roles, function (role) {
      delete role.checked;
    });

    var dialogScope = $scope.$new(false);
    dialogScope.mode = 'create';
    dialogScope.callback = function (user) {
      if ($rootScope.currentUser.info.empl_pk === user.empl_pk) {
        ownRolesChanged();
      }

      adminSvc.getUserInfo(user.empl_pk).then(function (updated) {
        var existing = _.findWhere($scope.users, { empl_pk: user.empl_pk });
        if (existing) {
          existing.roles = updated.roles;
        } else {
          $scope.users.push(updated);
        }

        updateUsersCount();
      });
    };

    ngDialog.open({
      templateUrl: 'components/dialogs/roles_edit/roles_edit.html',
      scope: dialogScope,
      controller: 'RolesEditCtrl'
    });
  };
};
