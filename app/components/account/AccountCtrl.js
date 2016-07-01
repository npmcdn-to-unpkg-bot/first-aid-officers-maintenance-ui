'use strict';
/*jshint camelcase: false*/

var _ = require('lodash');

module.exports = function ($scope, dataSvc, adminSvc, ngDialog, busySvc) {
  busySvc.busy('account');
  Promise.all([adminSvc.getInfo(), dataSvc.getTrainingTypes()]).then(_.spread(function (empl, trainingTypes) {
    if (empl.roles['trainer']) { //jshint ignore: line
      empl.roles['trainer'].types = _.map(empl.roles['trainer'].types, _.partial(_.get, trainingTypes)); // jshint ignore: line
    }

    $scope.empl = empl;
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
    ngDialog.openConfirm({
      template: 'components/dialogs/warning.html',
      scope: $scope.$new(),
      controller: ['$scope', 'AdminSvc', function ($scope, adminSvc) {
        $scope.innerHtml = '<div class="text-center">' +
          '<p>&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">modifier votre mot de passe</span>&nbsp;?<hr />' +
          'Cette action est irr&eacute;versible et prend effet imm&eacute;diatement.' +
          '<br />En confirmant, <span class="text-warning">vous serez d&eacute;connect&eacute(e)</span> et devrez vous identifier en utilisant votre nouveau mot de passe.</p></div>';
        $scope.confirm = function () {
          adminSvc.setPassword($scope.password_current, $scope.password).then(function () {
            $scope.$emit('alert', { type: 'success', msg: 'Mot de passe modifi&eacute;.' });
            $scope.disconnect(true);
          }, function () {
            $scope.$emit('alert', { type: 'danger', msg: 'Mot de passe actuel erron&eacute;.' });
          });

          $scope.closeThisDialog();
        };
      }]
    });
  };
};
