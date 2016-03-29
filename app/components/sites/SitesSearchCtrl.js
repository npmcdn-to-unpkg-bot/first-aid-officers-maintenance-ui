'use strict';
/* jshint camelcase: false*/

var _ = require('lodash');
module.exports = function ($rootScope, $routeParams, $scope, $location, ngDialog, busySvc, dataSvc) {
  $scope.comparisonOptions = [{
    value: 'lt',
    short: '<',
    display: 'inférieur à'
  }, {
    value: 'le',
    short: '≤',
    display: 'inférieur ou égal à'
  }, {
    value: 'eq',
    short: '=',
    display: 'égal à'
  }, {
    value: 'ge',
    short: '≥',
    display: 'supérieur ou égal à'
  }, {
    value: 'gt',
    short: '>',
    display: 'supérieur à'
  }];
  $scope.targetOptions = [{
    value: 'success',
    display: 'Atteinte'
  }, {
    value: 'warning',
    display: 'Atteinte aux deux tiers'
  }, {
    value: 'danger',
    display: 'Non atteinte'
  }];
  $scope.certificatesConditions = [{
    value: 'number',
    display: 'Nombre d\'agents formés'
  }, {
    value: 'percent',
    display: 'Taux d\'agents formés'
  }, {
    value: 'target',
    display: 'Par rapport à la cible'
  }];

  $scope.modify = function (cert) {
    var dialogScope = $scope.$new();
    dialogScope.cert = cert;
    ngDialog.open({
      template: './components/dialogs/sites_params_certificate.html',
      scope: dialogScope,
      controller: function ($scope) {
        $scope.params = {};
        $scope.add = function () {
          var display;
          switch ($scope.params.condition.value) {
            case 'number':
              display = 'Agents ' + $scope.cert.cert_short + ' ' + $scope.params.option.short + ' ' + $scope.params.data;
              break;
            case 'percent':
              display = 'Taux ' + $scope.cert.cert_short + ' ' + $scope.params.option.short + ' ' + $scope.params.data + '%';
              break;
            case 'target':
              display = 'Cible ' + $scope.cert.cert_short + ' ' + $scope.params.option.display.toLowerCase();
              break;
          }

          if ($scope.cert.conditions) {
            $scope.cert.conditions.push({ display: display });
          } else {
            $scope.cert.conditions = [{ display: display }];
          }

          $scope.closeThisDialog();
        };
      }
    });
  };

  busySvc.busy('sitesSearch');
  Promise.all([dataSvc.getDepartments(), dataSvc.getCertificates()]).then(function (results) {
    $scope.departments = _.values(results[0]);
    $scope.certificates = _.values(results[1]);
    busySvc.done('sitesSearch');
  });
};
