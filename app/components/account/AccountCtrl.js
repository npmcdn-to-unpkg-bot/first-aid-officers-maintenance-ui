'use strict';
/*jshint camelcase: false*/

var _ = require('lodash');

module.exports = function ($scope, dataSvc, adminSvc, ngDialog, busySvc) {
  busySvc.busy('account');
  Promise.all([adminSvc.getInfo(), dataSvc.getTrainingTypes()]).then(_.spread(function (user, trainingTypes) {
    if (user.roles['trainer']) { //jshint ignore: line
      user.roles['trainer'].types = _.map(user.roles['trainer'].types, _.partial(_.get, trainingTypes)); // jshint ignore: line
    }

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
    busySvc.done('account');
  }), function () {
    busySvc.done('account');
  });

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

  $scope.check = function (input) {
    input.form.password_confirm.$setValidity(false);
    if (document.getElementById('password_confirm').value !== document.getElementById('password').value) {
      document.getElementById('password_confirm').$setValidity(false);
    } else {
      input.setCustomValidity('');
    }
  };

  $scope.changePassword = function () {
    ngDialog.open({
      template: 'components/account/password_change.html',
      scope: _.extend($scope.$new(), {
        callback: function (currentPassword, newPassword, close) {
          ngDialog.openConfirm({
            template: 'components/dialogs/warning.html',
            scope: _.extend($scope.$new(), {
              innerHtml: '<div class="text-center">' +
                '<p>&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">modifier votre mot de passe</span>&nbsp;?<hr />' +
                'Cette action est irr&eacute;versible et prend effet imm&eacute;diatement.' +
                '<br />En confirmant, <span class="text-warning">vous serez d&eacute;connect&eacute(e)</span> et devrez vous identifier en utilisant votre nouveau mot de passe.</p></div>'
            })
          }).then(function () {
            adminSvc.setPassword(currentPassword, newPassword).then(function () {
              $scope.$emit('alert', { type: 'success', msg: 'Mot de passe modifi&eacute;.' });
              close();
              $scope.disconnect(true);
            }, function () {
              $scope.$emit('alert', { type: 'danger', msg: 'Mot de passe actuel erron&eacute;.' });
            });
          });
        }
      })
    });
  };

  $scope.changeId = function () {
    ngDialog.open({
      template: 'components/administration/users/id_change.html',
      scope: _.extend($scope.$new(), {
        callback: function (new_id, close) {
          ngDialog.openConfirm({
            template: 'components/dialogs/warning.html',
            scope: _.extend($scope.$new(), {
              innerHtml: '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">changer votre identifiant</span>&nbsp;?<hr />En confirmant, <span class="text-warning">vous serez d&eacute;connect&eacute(e)</span> et devrez vous identifier en utilisant votre nouveal identifiant.</p></div>'
            })
          }).then(function () {
            adminSvc.changeOwnId(new_id).then(function () {
              $scope.$emit('alert', {
                type: 'success',
                msg: 'Votre compte utilise dor&eacute;navant l\'identifiant&nbsp;: <kbd>' + new_id + '</kbd>',
                static: true
              });
              close();
              $scope.disconnect(true);
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
};
