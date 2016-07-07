'use strict';

var _ = require('lodash');
/* jshint camelcase: false */

module.exports = function ($rootScope, $scope, $route, $routeParams, busySvc, dataSvc, adminSvc, ngDialog) {
  $scope.roles = [{
    type: 'user'
  }, {
    type: 'access',
    levels: true
  }, {
    type: 'trainer'
  }, {
    type: 'admin',
    levels: true
  }];

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
        return !_.find($scope.roles, { type: 'user' }).checked;
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

  $scope.$watch('roles', function () {
    var user = _.find($scope.roles, { type: 'user' });
    var access = _.find($scope.roles, { type: 'access' });
    var trainer = _.find($scope.roles, { type: 'trainer' });
    var admin = _.find($scope.roles, { type: 'admin' });
    if (!user.checked) {
      $scope.roles[1].checked = false;
      $scope.roles[2].checked = false;
      $scope.roles[3].checked = false;
    }

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
      $scope.roles[1].level = access.level ? access.level : 1; // 1: default level
    }

    if (trainer.checked) {
      $scope.roles[2].profile = trainer.profile ? trainer.profile : $scope.trainerProfiles[0]; // 0 -> default trainer profile.
    }

    if (admin.checked) {
      $scope.roles[3].level = admin.level ? admin.level : 1; // 1: default level
    }
  }, true);

  busySvc.busy('rolesManagement');
  busySvc.busy('ongoingOperation', true);
  Promise.all([adminSvc.getUserInfo($routeParams.empl_pk), adminSvc.getTrainerProfiles(), dataSvc.getTrainingTypes(), dataSvc.getCertificates()])
    .then(_.spread(function (empl, trainerProfiles, trainingtypes, certificates) {
      $scope.trainingtypes = trainingtypes;
      $scope.certificates = certificates;
      $scope.empl = _.extend(empl, { fullname: (empl.empl_gender ? 'M.' : 'Mme') + ' ' + empl.empl_surname + ' ' + empl.empl_firstname });
      $scope.trainerProfiles = _.each(trainerProfiles, function (profile) {
        profile.types = _.map(profile.types, _.partial(_.get, trainingtypes));
      });

      busySvc.done('rolesManagement');

      // timeout for uib-collapse to open
      setTimeout(function () {
        _.each($scope.roles, function (role) {
          switch (role.type) {
            case 'access':
            case 'admin':
              role.level = empl.roles[role.type];
              break;
            case 'trainer':
              role.profile = trainerProfiles[empl.roles[role.type]];
          }
          role.checked = !_.isUndefined(empl.roles[role.type]);
        });
        $scope.$apply();
      }, 0);
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

  $scope.update = function () {
    var roles = _($scope.roles).filter('checked').keyBy('type').mapValues(roleMapper).value();
    if (!roles['user']) { // jshint ignore: line
      return $scope.close();
    }

    var creation = _.isEmpty($scope.empl.roles);
    ngDialog.openConfirm({
      template: './components/dialogs/warning.html',
      scope: _.extend($scope.$new(), {
        innerHtml: '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">' + (creation ? 'cr&eacute;er un compte</span> pour ' :
          'modifier les privil&egrave;ges</span> de ') + $scope.empl.fullname + '&nbsp;?'
      })
    }).then(function () {
      (creation ? adminSvc.createUser : adminSvc.updateUser)($scope.empl.empl_pk, _($scope.roles).filter('checked').keyBy('type').mapValues(roleMapper).value())
      .then(function (response) {
        if (creation) {
          $scope.$emit('alert', {
            type: 'success',
            msg: 'Mot de passe g&eacute;n&eacute;r&eacute;&nbsp: <strong><samp>' + response.data +
              '</samp></strong><hr />Veuillez transmettre son nouveau mot de passe &agrave; ' + $scope.empl.fullname + '.',
            static: true
          });
        } else {
          $scope.$emit('alert', { type: 'success', msg: 'Privil&egrave;ges de ' + $scope.empl.fullname + ' mis &agrave; jour.' });

        }
        busySvc.done('ongoingOperation');
        window.history.back();
      }, _.partial($scope.$emit, 'error'));
    });
  };

  $scope.close = function () {
    ngDialog.openConfirm({
      template: './components/dialogs/warning.html',
      scope: _.extend($scope.$new(), {
        _type: 'danger',
        innerHtml: '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-danger">fermer le compte</span> de ' + $scope.empl.fullname + '&nbsp;?'
      })
    }).then(function () {
      adminSvc.deleteUser($scope.empl.empl_pk).then(function () {
        $scope.$emit('alert', { type: 'success', msg: 'Compte de ' + $scope.empl.fullname + ' ferm&eacute;.' });
        busySvc.done('ongoingOperation');
        window.history.back();
      }, _.partial($scope.$emit, 'error'));
    });
  };

  $scope.cancel = function () {
    window.history.back();
  };

  $scope.reset = function () {
    ngDialog.openConfirm({
      template: 'components/dialogs/warning.html',
      scope: _.extend($scope.$new(), {
        innerHtml: '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">r&eacute;initialiser le mot de passe</span> de cet agent&nbsp;? Cette modification est irr&eacute;versible et prend effet imm&eacute;diatement.'
      })
    }).then(function () {
      adminSvc.resetUserPassword($scope.empl.empl_pk).then(function (password) {
        $scope.$emit('alert', {
          type: 'success',
          msg: 'Mot de passe r&eacute;initialis&eacute;&nbsp: <strong><samp>' + password +
            '</samp></strong><hr />Veuillez transmettre son nouveau mot de passe &agrave; l\'agent concern&eacute;.',
          static: true
        });
      });
    });
  };
};
