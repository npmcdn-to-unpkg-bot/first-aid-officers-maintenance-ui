'use strict';

var _ = require('lodash');

/* jshint camelcase: false */
module.exports = function ($scope, adminSvc, dataSvc, busySvc, ngDialog, $route) {
  busySvc.busy('trainerProfiles');
  Promise.all([adminSvc.getTrainerProfiles(), dataSvc.getTrainingTypes()]).then(_.spread(function (trainerProfiles, trainingTypes) {
    $scope.trainerProfiles = _(trainerProfiles).map(function (profile) {
      return _.extend(profile, { types: _.map(profile.types, _.partial(_.get, trainingTypes)) });
    }).value();
    $scope.types = _(trainingTypes).orderBy('trty_order').value();
    busySvc.done('trainerProfiles');
  }), _.partial(busySvc.done, 'trainerProfiles'));

  function confirm(msg, callback, extension) {
    ngDialog.openConfirm({
      template: './components/dialogs/warning.html',
      scope: _.extend($scope.$new(), { innerHtml: msg }, extension)
    }).then(callback);
  }

  $scope.edit = function (profile) {
    $scope.profile = _.cloneDeep(profile) || { types: [] };
    ngDialog.open({
      template: './components/administration/users/trainer_profile_edit.html',
      scope: $scope,
      controller: ['$scope', function (scope) {
        scope.$watchCollection('profile.types', function () {
          scope.remaining = _.differenceBy(scope.types, scope.profile.types, 'trty_pk');
        });

        scope.accept = function (type) {
          scope.profile.types = _.intersectionBy(scope.types, [type].concat(scope.profile.types), 'trty_pk');
        };

        function complete(alert) {
          scope.$emit('alert', alert);
          $route.reload();
          scope.closeThisDialog();
        }

        scope.exec = function () {
          if (scope.profile.trpr_pk !== undefined) {
            confirm('&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">modifier</span> le profil <span class="text-warning">' + scope.profile.trpr_id +
              '</span>&nbsp?',
              function () {
                adminSvc.putTrainerProfile(scope.profile.trpr_pk, _.extend(_.cloneDeep(scope.profile), { types: _.map(scope.profile.types, 'trty_pk') }))
                  .then(_.partial(complete, { type: 'success', msg: 'Profil formateur mis &agrave; jour.' }), _.bind(scope.$emit, scope, 'error'));
              });
          } else {
            confirm('&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-success">cr&eacute;er</span> le profil <span class="text-success">' + scope.profile.trpr_id +
              '</span>&nbsp?',
              function () {
                adminSvc.postTrainerProfile(_.extend(_.cloneDeep(scope.profile), { types: _.map(scope.profile.types, 'trty_pk') }))
                  .then(_.partial(complete, { type: 'success', msg: 'Profil formateur cr&eacute;&eacute;.' }), _.bind(scope.$emit, scope, 'error'));
              }, { _type: 'success', _title: 'Confirmer' });
          }
        };

        scope.delete = function () {
          confirm(
            '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-danger">supprimer</span> le profil <span class="text-danger">' + scope.profile.trpr_id +
            '</span>&nbsp?',
            function () {
              adminSvc.deleteTrainerProfile(scope.profile.trpr_pk)
                .then(_.partial(complete, { type: 'success', msg: 'Profil formateur supprim&eacute;.' }), _.bind(scope.$emit, scope, 'error'));
            }, { _type: 'danger' });
        };
      }]
    });
  };
};
