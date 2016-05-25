'use strict';

var _ = require('lodash');

module.exports = function ($scope, $rootScope, adminSvc, dataSvc, busySvc) {
  $scope.round = Math.round;
  busySvc.busy('certMgmt');
  Promise.all([dataSvc.getCertificates(), dataSvc.getTrainingTypes()]).then(_.spread(function (certificates, trainingTypes) {
    $scope.certificates = certificates;
    $scope.trainingTypes = trainingTypes;
    busySvc.done('certMgmt');
  }), function () {
    busySvc.done('certMgmt');
  });
};
