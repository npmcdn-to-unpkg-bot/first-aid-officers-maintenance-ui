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

  function setSearchUrl() {
    $location.search('filter', helper.toURIComponent($scope.filter));
    $location.search('display', helper.toURIComponent($scope.display));
  }

  $scope.search = function () {
    $location.path('/sites/results');
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
      controller: function ($scope) {
        $scope.params = {};
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
      }
    });
  };

  busySvc.busy('employeesSearch');
  Promise.all([dataSvc.getCertificates(), dataSvc.getSites()]).then(_.spread(function (cert, sites) {
    $scope.sites = sites;
    $scope.filter = helper.fromURIComponent($location.search().filter);
    $scope.certificates = helper.fillUp(_.values(cert), $scope.filter.certificates);
    $scope.display = helper.fromURIComponent($location.search().display);
    $scope.$watch('filter', setSearchUrl, true);
    $scope.$watch('display', setSearchUrl, true);
    busySvc.done('employeesSearch');
  }));
};
