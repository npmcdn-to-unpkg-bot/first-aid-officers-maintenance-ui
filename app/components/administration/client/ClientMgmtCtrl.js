'use strict';

var _ = require('lodash');

module.exports = function ($scope, $route, clientSvc, busySvc, ngDialog) {
  clientSvc.getClientInfo().then(function (info) {
    $scope.client = info;
  }, _.partial($scope.$emit, 'error'));

  $scope.update = function () {
    ngDialog.openConfirm({
      template: './components/dialogs/warning.html',
      scope: _.extend($scope.$new(), {
        _title: 'Confirmation requise',
        innerHtml: '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">mettre &agrave; jour</span> les informations client&nbsp;?'
      })
    }).then(function () {
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
      }, function () {
        $scope.$emit('error');
        busySvc.done('clientUpdate');
      });
    });
  };
};
