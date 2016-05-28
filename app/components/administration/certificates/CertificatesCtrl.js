'use strict';

var _ = require('lodash');

/* jshint camelcase: false */
module.exports = function ($scope, $rootScope, updateSvc, dataSvc, busySvc, ngDialog, $route) {
  $scope.round = Math.round;
  busySvc.busy('certMgmt');
  Promise.all([dataSvc.getCertificates(), dataSvc.getTrainingTypes()]).then(_.spread(function (certificates, trainingTypes) {
    $scope.certificates = _.orderBy(_.values(certificates), 'cert_order');
    $scope.trainingTypes = trainingTypes;
    busySvc.done('certMgmt');
  }), function () {
    busySvc.done('certMgmt');
  });

  $scope.$watchCollection('certificates', _.partial(_.each, _, function (cert, idx) {
    cert.idx = idx + 1;
  }));

  function confirm(msg, callback, extension) {
    ngDialog.openConfirm({
      template: './components/dialogs/warning.html',
      scope: _.extend($scope.$new(), { innerHtml: msg }, extension)
    }).then(callback);
  }

  $scope.startReorder = function () {
    $scope.alerts.push({ type: 'primary', msg: 'D&eacute;placez les panneaux pour les r&eacute;organiser.' });
    $scope.reorder = true;
  };

  $scope.saveReorder = function () {
    confirm('&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">sauvegarder la r&eacute;organisation</span> des aptitudes&nbsp;?', function () {
      updateSvc.reorderCerts(_.zipObject(_.map($scope.certificates, 'cert_pk'), _.map($scope.certificates, 'idx'))).then(function () {
        $rootScope.alerts.push({ type: 'success', msg: 'Aptitudes r&eacute;ordonn&eacute;es.' });
        $route.reload();
      }, $rootScope.error);
      $scope.reorder = false;
    });
  };

  $scope.cancelReorder = function () {
    confirm('&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">annuler la r&eacute;organisation</span> des aptitudes&nbsp;?', function () {
      $scope.certificates = _.sortBy($scope.certificates, 'cert_order');
      $scope.reorder = false;
    });
  };

  $scope.edit = function (cert) {
    $scope.cert = _.cloneDeep(cert);
    ngDialog.open({
      template: './components/administration/certificates/certificate_edit.html',
      scope: $scope,
      controller: ['$scope', function ($scope) {
        function complete(alert) {
          $rootScope.alerts.push(alert);
          $route.reload();
          $scope.closeThisDialog();
        }

        $scope.exec = function () {
          if ($scope.cert.cert_pk) {
            confirm('&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">modifier</span> l\'aptitude <span class="text-warning">' + $scope.cert.cert_name +
              '</span>&nbsp?',
              function () {
                updateSvc.updateCert($scope.cert.cert_pk, $scope.cert.cert_name, $scope.cert.cert_short, $scope.cert.cert_target).then(
                  _.partial(complete, { type: 'success', msg: 'Aptitude mise &agrave; jour.' }), $rootScope.error);
              });
          } else {
            confirm('&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-success">cr&eacute;er</span> l\'aptitude <span class="text-success">' + $scope.cert.cert_name +
              '</span>&nbsp?',
              function () {
                updateSvc.createCert($scope.cert.cert_name, $scope.cert.cert_short, $scope.cert.cert_target).then(
                  _.partial(complete, { type: 'success', msg: 'Type de formation cr&eacute;&eacute;e.' }), $rootScope.error);
              }, { _type: 'success', _title: 'Confirmer' });
          }
        };

        $scope.delete = function () {
          confirm('&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">supprimer</span> l\'aptitude <span class="text-warning">' + $scope.cert.cert_name +
            '</span>&nbsp?',
            function () {
              updateSvc.deleteCert($scope.cert.cert_pk).then(_.partial(complete, { type: 'success', msg: 'Aptitude effac&eacute;e.' }), $rootScope.error);
            });
        };
      }]
    });
  };
};
