'use strict';

var _ = require('lodash');
var moment = require('moment');

// jshint:ignore camelcase

module.exports = function ($scope, $rootScope, updateSvc, dataSvc, busySvc, ngDialog, $route) {
  busySvc.busy('trainingTypes');
  Promise.all([dataSvc.getTrainingTypes(), dataSvc.getCertificates()]).then(_.spread(function (trainingTypes, certificates) {
    $scope.trainingTypes = _(trainingTypes).map(function (type) {
      return _.extend(type, { validityYears: moment.duration(type.trty_validity, 'months').asYears() }); //jshint ignore:line
    }).orderBy('trty_order').value();
    $scope.certificates = _.values(certificates);
    busySvc.done('trainingTypes');
  }), _.partial(busySvc.done, 'trainingTypes'));

  $scope.$watchCollection('trainingTypes', function () {
    _.each($scope.trainingTypes, function (type, idx) {
      type.idx = idx + 1;
    });
  });

  function confirm(msg, callback) {
    var dialogScope = $scope.$new();
    dialogScope.innerHtml = msg;
    ngDialog.openConfirm({
      template: './components/dialogs/warning.html',
      scope: dialogScope
    }).then(callback);
  }

  $scope.startReorder = function () {
    $scope.alerts.push({ type: 'primary', msg: 'D&eacute;placez les panneaux pour les r&eacute;organiser.' });
    $scope.reorder = true;
  };

  $scope.saveReorder = function () {
    confirm('&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">sauvegarder la r&eacute;organisation</span> des types de formation&nbsp;?', function () {
      updateSvc.reorderTrtys(_.zipObject(_.map($scope.trainingTypes, 'trty_pk'), _.map($scope.trainingTypes, 'idx'))).then(function () {
        $rootScope.alerts.push({ type: 'success', msg: 'Types de formations r&eacute;ordonn&eacute;s.' });
        $route.reload();
      }, $rootScope.error);
      $scope.reorder = false;
    });
  };

  $scope.cancelReorder = function () {
    confirm('&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">annuler la r&eacute;organisation</span> des types de formation&nbsp;?', function () {
      $scope.trainingTypes = _.sortBy($scope.trainingTypes, 'trty_order');
      $scope.reorder = false;
    });
  };

  $scope.edit = function (type) {
    $scope.type = _.cloneDeep(type) || { certificates: [] };
    ngDialog.open({
      template: './components/administration/certificates/training_type_edit.html',
      scope: $scope,
      controller: ['$scope', 'ngDialog', function ($scope, ngDialog) {
        $scope.$watchCollection('type.certificates', function () {
          $scope.remaining = _.differenceBy($scope.certificates, $scope.type.certificates, 'cert_pk');
        });

        $scope.accept = function (cert) {
          $scope.type.certificates = _.intersectionBy($scope.certificates, [cert].concat($scope.type.certificates), 'cert_pk');
        };

        $scope.exec = _.partial(confirm, '&Ecirc;tes-vous s&ucirc;r(e) de vouloir blablabla&nbsp?', function () {
          if ($scope.type.trty_pk) {
            updateSvc.updateTrty($scope.type.trty_pk, $scope.type.trty_name, $scope.type.trty_validity, _.map($scope.type.certificates, 'cert_pk')).then(function () {
              $rootScope.alerts.push({ type: 'success', msg: 'Type de formation mis &agrave; jour.' });
              $route.reload();
              $scope.closeThisDialog();
            }, $rootScope.error);
          } else {
            updateSvc.createTrty($scope.type.trty_name, $scope.type.trty_validity, _.map($scope.type.certificates, 'cert_pk')).then(function () {
              $rootScope.alerts.push({ type: 'success', msg: 'Type de formation cr&eacute;&eacute;.' });
              $route.reload();
              $scope.closeThisDialog();
            }, $rootScope.error);
          }
        });

        $scope.delete = _.partial(confirm,
          'Cette modification est irr&eacute;versible et entra&icirc;nera &eacute;galement la <span class="text-warning">suppression de l\'int&eacute;gralit&eacute; des formations de ce type</span>.' +
          '<hr />&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">supprimer</span> le type <span class="text-warning">' + $scope.type.trty_name +
          '</span>&nbsp?',
          function () {
            updateSvc.deleteTrty($scope.type.trty_pk).then(function () {
              $rootScope.alerts.push({ type: 'success', msg: 'Type de formation effac&eacute;.' });
              $route.reload();
              $scope.closeThisDialog();
            }, $rootScope.error);
          });
      }]
    });
  };
};
