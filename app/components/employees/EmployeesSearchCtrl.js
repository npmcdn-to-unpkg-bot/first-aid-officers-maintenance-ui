'use strict';
/* jshint camelcase: false*/

var _ = require('lodash');
var helper = require('./employeesSearchHelper.js');

module.exports = function ($rootScope, $scope, $location, ngDialog, busySvc, dataSvc) {
  $scope.filter = {};
  $scope.display = {};

  $scope.$watch('certificates', function (certificates) {
    $scope.filter.certificates = helper.stripDown(certificates);
  }, true);

  $scope.$watch('site', function (site) {
    if (site && site.site_pk) {
      $scope.filter.site = site.site_pk;
    } else {
      delete $scope.filter.site;
    }
  });

  function setSearchUrl() {
    $location.search('filter', helper.toURIComponent($scope.filter)).replace();
    $location.search('display', helper.toURIComponent($scope.display)).replace();
  }

  $scope.search = function () {
    $location.path('/employees/results');
  };

  $scope.addCondition = function (cert) {
    var dialogScope = $scope.$new();
    dialogScope.cert = cert;
    dialogScope.recentOptions = helper.recentOptions;
    dialogScope.statusOptions = helper.statusOptions;
    dialogScope.certificatesConditions = helper.certificatesConditions;

    ngDialog.open({
      template: './components/dialogs/employees_params_certificate.html',
      scope: dialogScope,
      controller: ['$scope', function ($scope) {
        $scope.params = {};
        $scope.isValid = function () {
          var res = true;
          if (!$scope.params.condition) {
            return false;
          }

          if ($scope.params.condition.value !== 'expiring' && $scope.params.condition.value !== 'expiry') {
            res = $scope.params.option !== undefined;
          }

          if ($scope.params.condition.value !== 'status') {
            res = res && $scope.params.data !== undefined && $scope.params.data !== null;
          }

          if ($scope.params.condition.value === 'expiry') {
            res = res && $scope.params.data && $scope.params.data.from;
            res = res && $scope.params.data.to && !isNaN($scope.params.data.from.getTime()) && !isNaN($scope.params.data.to.getTime());
          }

          return res;
        };

        $scope.add = function () {
          var condition = {
            display: helper.getConditionDisplay($scope.cert, $scope.params),
            params: $scope.params
          };

          if ($scope.cert.conditions) {
            $scope.cert.conditions.push(condition);
          } else {
            $scope.cert.conditions = [condition];
          }

          $scope.closeThisDialog();
        };
      }]
    });
  };

  busySvc.busy('employeesSearch');
  Promise.all([dataSvc.getCertificates(), dataSvc.getSites()]).then(_.spread(function (cert, sites) {
    $scope.sites = sites;
    $scope.filter = helper.fromURIComponent($location.search().filter);
    $scope.site = sites[$scope.filter.site];
    $scope.certificates = helper.fillUp(_.values(cert), $scope.filter.certificates);
    $scope.display = helper.fromURIComponent($location.search().display);
    $scope.$watch('filter', setSearchUrl, true);
    $scope.$watch('display', setSearchUrl, true);
    busySvc.done('employeesSearch');
  }));
};
