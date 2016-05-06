'use strict';
/* jshint camelcase: false*/

var _ = require('lodash');
var helper = require('./sitesSearchHelper.js');

module.exports = function ($rootScope, $scope, $location, ngDialog, busySvc, dataSvc) {
  $scope.filter = {};
  $scope.display = {};
  $scope.comparisonOptions = helper.comparisonOptions;

  $scope.$watch('certificates', function (certificates) {
    $scope.filter.certificates = helper.stripDown(certificates);
  }, true);

  function setSearchUrl() {
    $location.search('filter', helper.toURIComponent($scope.filter)).replace();
    $location.search('display', helper.toURIComponent($scope.display)).replace();
  }

  $scope.search = function () {
    $location.path('/sites/results');
  };

  $scope.addCondition = function (cert) {
    var dialogScope = $scope.$new();
    dialogScope.cert = cert;
    dialogScope.comparisonOptions = helper.comparisonOptions;
    dialogScope.targetOptions = helper.targetOptions;
    dialogScope.certificatesConditions = helper.certificatesConditions;

    ngDialog.open({
      template: './components/dialogs/sites_params_certificate.html',
      scope: dialogScope,
      controller: ['$scope', function ($scope) {
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
      }]
    });
  };

  $scope.steps = [{
    step: 1,
    title: 'Param&egrave;tres de recherche',
    template: 'components/sites/sites_search_step1.html'
  }, {
    step: 2,
    title: 'Param&egrave;tres d\'affichage',
    template: 'components/sites/sites_search_step2.html'
  }];
  $scope.currentStep = $scope.steps[0];

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
