'use strict';
/* jshint camelcase: false*/

var _ = require('lodash');
var helper = require('./sitesSearchHelper.js');

module.exports = function ($rootScope, $routeParams, $scope, $location, ngDialog, busySvc, dataSvc) {
  $scope.comparisonOptions = helper.comparisonOptions;
  $scope.targetOptions = helper.targetOptions;
  $scope.certificatesConditions = helper.certificatesConditions;

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
    setSearchUrl();
  };

  $scope.addCondition = function (cert) {
    var dialogScope = $scope.$new();
    dialogScope.cert = cert;
    ngDialog.open({
      template: './components/dialogs/sites_params_certificate.html',
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

  busySvc.busy('sitesSearch');
  Promise.all([dataSvc.getDepartments(), dataSvc.getCertificates()]).then(function (results) {
    $scope.departments = _.values(results[0]);
    $scope.filter = helper.fromURIComponent($location.search().filter);
    $scope.certificates = helper.fillUp(_.values(results[1]), $scope.filter.certificates);
    $scope.display = helper.fromURIComponent($location.search().display);
    $scope.$watch('filter', setSearchUrl, true);
    $scope.$watch('display', setSearchUrl, true);
    busySvc.done('sitesSearch');
  });
};
