'use strict';

var _ = require('lodash');
/* jshint camelcase: false */

module.exports = function ($rootScope, $scope, $location, $route, $routeParams, busySvc, dataSvc, adminSvc, ngDialog) {

  $scope.colorFor = function (level) {
    switch (level) {
      case 1:
        return 'danger';
      case 2:
        return 'warning';
      case 3:
        return 'primary';
      case 4:
        return 'success';
    }
  };

  $scope.disabled = function (role, level) {
    var access = _.find($scope.roles, { type: 'access' });
    switch (role.type) {
      case 'user':
        return false;
      case 'access':
        return level === 1 && $scope.user.user_type === 'department';
      case 'trainer':
        return !access.checked || access.level < 4;
      case 'admin':
        if (!access.checked) {
          return true;
        }

        if (!level || level === 1) {
          return false;
        }

        if (level === 2) {
          return access.level < 3;
        }

        return access.level < 4;
    }
  };

  $scope.$watch('roles', function (roles) {
    if (!roles) {
      return;
    }

    var access = _.find($scope.roles, { type: 'access' });
    var trainer = _.find($scope.roles, { type: 'trainer' });
    var admin = _.find($scope.roles, { type: 'admin' });

    if (!access.checked) {
      $scope.roles[2].checked = false;
      $scope.roles[3].checked = false;
    } else {
      if (access.level < 4) {
        $scope.roles[2].checked = false;
        $scope.roles[3].level = Math.min(2, $scope.roles[3].level);
      }
      if (access.level < 3) {
        $scope.roles[3].level = Math.min(1, $scope.roles[3].level);
      }
      $scope.roles[1].level = access.level ? access.level : $scope.user.user_type === 'department' ? 2 : 1; // 1: default level, 2 for department-type users
    }

    if (trainer.checked) {
      $scope.roles[2].profile = trainer.profile ? trainer.profile : $scope.trainerProfiles[0]; // 0 -> default trainer profile.
    }

    if (admin.checked) {
      $scope.roles[3].level = admin.level ? admin.level : 1; // 1: default level
    }
  }, true);

  function init() {
    _.each($scope.roles, function (role) {
      switch (role.type) {
        case 'access':
        case 'admin':
          role.level = $scope.user.roles[role.type];
          break;
        case 'trainer':
          role.profile = $scope.trainerProfiles[$scope.user.roles[role.type]];
      }
      role.checked = !_.isUndefined($scope.user.roles[role.type]);
    });

    setTimeout(function () { $scope.$apply(); }, 0);
  }

  busySvc.busy('rolesManagement');
  Promise.all([adminSvc.getUserInfo($routeParams.user_id), adminSvc.getTrainerProfiles(), dataSvc.getTrainingTypes(), dataSvc.getCertificates()])
    .then(_.spread(function (user, trainerProfiles, trainingtypes, certificates) {
      $scope.roles = [{ type: 'user' }, { type: 'access', levels: true }, { type: 'trainer' }, { type: 'admin', levels: true }];
      $scope.trainingtypes = trainingtypes;
      $scope.certificates = certificates;
      $scope.user = _.extend(user, {
        summary: (function (type, resource) {
          switch (type) {
            case 'employee':
              return (resource.empl_gender ? 'M.' : 'Mme') + ' ' + resource.empl_surname + ' ' + resource.empl_firstname;
            case 'site':
              return resource.site_name;
            case 'department':
              return resource.dept_name;
          }
        })(user.user_type, user)
      });
      $scope.trainerProfiles = _.each(trainerProfiles, function (profile) {
        profile.types = _.map(profile.types, _.partial(_.get, trainingtypes));
      });

      busySvc.done('rolesManagement');

      // timeout for uib-collapse to open
      setTimeout(init, 0);
    }), _.partial(busySvc.done, 'rolesManagement'));

  function roleMapper(role) {
    switch (role.type) {
      case 'user':
        return true;
      case 'access':
      case 'admin':
        return role.level;
      case 'trainer':
        return role.profile.trpr_pk;
    }
  }

  //TODO: IMPL SELF UPDATE
  $scope.update = function () {
    ngDialog.openConfirm({
      template: './components/dialogs/warning.html',
      scope: _.extend($scope.$new(), {
        innerHtml: '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">modifier les privil&egrave;ges</span> de <span class="text-warning">' + $scope.user
          .summary + '</span>&nbsp;?' + ($scope.userInfo.user_id === $scope.user.user_id ?
            '<hr />En confirmant, <span class="text-warning">vous serez d&eacute;connect&eacute(e)</span> et devrez vous identifier de nouveau.' : '')
      })
    }).then(function () {
      adminSvc.updateUser($scope.user.user_id, {
          user_type: $scope.user.user_type,
          user_empl_fk: $scope.user.empl_pk,
          user_site_fk: $scope.user.site_pk,
          user_dept_fk: $scope.user.dept_pk,
          roles: _($scope.roles).filter('checked').keyBy('type').mapValues(roleMapper).value()
        })
        .then(function () {
          $scope.$emit('alert', { type: 'success', msg: 'Privil&egrave;ges de <strong>' + $scope.user.summary + '</strong> mis &agrave; jour.' });
          busySvc.done('ongoingOperation');
          if ($scope.userInfo.user_id === $scope.user.user_id) {
            $scope.disconnect(true);
          } else {
            $route.reload();
          }
        }, _.partial($scope.$emit, 'error'));
    });
  };

  //TODO: IMPL SELF CLOSE
  $scope.close = function () {
    ngDialog.openConfirm({
      template: './components/dialogs/warning.html',
      scope: _.extend($scope.$new(), {
        _type: 'danger',
        innerHtml: '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-danger">fermer le compte</span> de <span class="text-danger">' + $scope.user.summary +
          '</span>&nbsp;?' + ($scope.userInfo.user_id === $scope.user.user_id ?
            '<hr />En confirmant, <span class="text-danger">vous serez d&eacute;connect&eacute(e)</span>.' : '')
      })
    }).then(function () {
      adminSvc.deleteUser($scope.user.user_id).then(function () {
        $scope.$emit('alert', { type: 'success', msg: 'Compte de <strong>' + $scope.user.summary + '</strong> ferm&eacute;.' });
        busySvc.done('ongoingOperation');

        if ($scope.userInfo.user_id === $scope.user.user_id) {
          $scope.disconnect(true);
        } else {
          window.history.back();
        }
      }, _.partial($scope.$emit, 'error'));
    });
  };

  $scope.cancel = function () {
    $scope.editing = false;
    init();
    busySvc.done('ongoingOperation');
  };

  $scope.edit = function () {
    $scope.editing = true;
    busySvc.busy('ongoingOperation', true);
  };

  //TODO: IMPL SELF ID CHANGE
  $scope.changeId = function () {
    ngDialog.open({
      template: 'components/administration/users/id_change.html',
      scope: _.extend($scope.$new(), {
        callback: function (new_id, close) {
          ngDialog.openConfirm({
            template: 'components/dialogs/warning.html',
            scope: _.extend($scope.$new(), {
              innerHtml: '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">changer l\'identifiant</span> de <span class="text-warning">' +
                $scope.user.summary + '</span>&nbsp;?' + ($scope.userInfo.user_id === $scope.user.user_id ?
                  '<hr />En confirmant, <span class="text-warning">vous serez d&eacute;connect&eacute(e)</span> et devrez vous identifier en utilisant votre nouvel identifiant.' :
                  '')
            })
          }).then(function () {
            adminSvc.changeId($scope.user.user_id, new_id).then(function () {
              $scope.$emit('alert', {
                type: 'success',
                msg: '<strong>' + $scope.user.summary + '</strong> utilise dor&eacute;navant l\'identifiant <kbd>' + new_id +
                  '</kbd><hr />Veuillez transmettre son/leur nouvel identifiant &agrave;/aux agent(s) concern&eacute;(s).',
                static: true
              });
              close();
              if ($scope.userInfo.user_id === $scope.user.user_id) {
                $scope.disconnect(true);
              } else {
                $location.path('administration/users/' + new_id).search({}).replace();
              }
            }, function () {
              $scope.$emit('alert', {
                type: 'danger',
                msg: 'L\'identifiant <kbd>' + new_id +
                  '</kbd> est actuellement attribu&eacute; &agrave; un autre compte utilisateur et n\'est ainsi pas disponible.',
                static: true
              });
            });
          });
        }
      })
    });
  };

  //TODO: IMPL SELF RESET
  $scope.reset = function () {
    ngDialog.openConfirm({
      template: 'components/dialogs/warning.html',
      scope: _.extend($scope.$new(), {
        innerHtml: '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">r&eacute;initialiser le mot de passe</span> de <span class="text-warning">' +
          $scope.user.summary + '</span>&nbsp;? Cette modification est irr&eacute;versible et prend effet imm&eacute;diatement.' + ($scope.userInfo.user_id === $scope.user
            .user_id ?
            '<hr />En confirmant, <span class="text-warning">vous serez d&eacute;connect&eacute(e)</span> et devrez vous identifier en utilisant votre nouveau mot de passe.' :
            '')
      })
    }).then(function () {
      adminSvc.resetUserPassword($scope.user.user_id).then(function (password) {
        $scope.$emit('alert', {
          type: 'success',
          msg: 'Mot de passe r&eacute;initialis&eacute; pour <strong>' + $scope.user.summary + '</strong>&nbsp: <kbd>' + password +
            '</kbd><hr />Veuillez transmettre son/leur nouveau mot de passe &agrave;/aux agent(s) concern&eacute;(s).',
          static: true
        });

        if ($scope.userInfo.user_id === $scope.user.user_id) {
          $scope.disconnect(true);
        }
      });
    });
  };
};
