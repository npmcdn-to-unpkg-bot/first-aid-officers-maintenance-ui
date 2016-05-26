'use strict';

var _ = require('lodash');

module.exports = function ($scope, $rootScope, adminSvc, dataSvc, busySvc, ngDialog) {
  $scope.round = Math.round;
  busySvc.busy('certMgmt');
  Promise.all([dataSvc.getCertificates(), dataSvc.getTrainingTypes()]).then(_.spread(function (certificates, trainingTypes) {
    $scope.certificates = certificates;
    $scope.trainingTypes = trainingTypes;
    busySvc.done('certMgmt');
  }), function () {
    busySvc.done('certMgmt');
  });

  $scope.edit = function (cert) {
    $scope.cert = _.cloneDeep(cert);
    ngDialog.open({
      template: './components/administration/certificates/certificate_edit.html',
      scope: $scope,
      controller: ['$scope', 'ngDialog', function ($scope, ngDialog) {
        $scope.exec = function () {
          $scope.innerHtml = '&Ecirc;tes-vous s&ucirc;r(e) de vouloir blablabla&nbsp?';
          ngDialog.openConfirm({
            template: './components/dialogs/warning.html',
            scope: $scope
          }).then(_.partial(console.log, 'rofl :D'));
        };
      }]
    });
  };
};
