'use strict';

var _ = require('lodash');

module.exports = function ($scope, $rootScope, updateSvc, dataSvc, busySvc, ngDialog, $route) {
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
        function confirm(msg, callback) {
          var dialogScope = $scope.$new();
          dialogScope.innerHtml = msg;
          ngDialog.openConfirm({
            template: './components/dialogs/warning.html',
            scope: dialogScope
          }).then(callback);
        }

        $scope.exec = _.partial(confirm, '&Ecirc;tes-vous s&ucirc;r(e) de vouloir blablabla&nbsp?', function () {
          //TODO: impl;
        });

        $scope.delete = _.partial(confirm, '&Ecirc;tes-vous s&ucirc;r(e) de vouloir blablabla&nbsp?', function () {
          //TODO: impl;
        });

      }]
    });
  };
};
