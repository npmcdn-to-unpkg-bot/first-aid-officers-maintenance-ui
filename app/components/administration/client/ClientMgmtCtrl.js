'use strict';

var _ = require('lodash');

module.exports = function ($scope, $route, clientSvc, busySvc, ngDialog) {
  clientSvc.getClientInfo().then(function (info) {
    $scope.client = info;
  }, _.partial($scope.$emit, 'error'));

  $scope.update = function () {
    busySvc.busy('clientUpdate', true);
    var promises = [];
    if ($scope.form.file) {
      promises = promises.concat([clientSvc.uploadLogo($scope.form.file)]);
    }

    if ($scope.form.$dirty) {
      promises = promises.concat([clientSvc.updateClientInfo($scope.client)]);
    }

    Promise.all(promises).then(function () {
      busySvc.done('clientUpdate');
      $scope.$emit('clientUpdate');
      $scope.$emit('alert', { type: 'success', msg: 'Configuration de la solution mise &agrave; jour.' });
      $route.reload();
    }, _.partial($scope.$emit, 'error'));
  };
};
