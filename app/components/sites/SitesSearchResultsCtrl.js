'use strict';
/* jshint camelcase: false*/

var _ = require('lodash');
var helper = require('./sitesSearchHelper.js');

module.exports = function ($rootScope, $scope, $location, ngDialog, busySvc, dataSvc) {
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

  $scope.params = function () {
    $location.path('/sites/search');
  };

  $scope.getLink = function () {
    $rootScope.alerts.push({
      type: 'success',
      msg: 'Utilisez le lien ci-dessous (clic droit, puis <em>Copier l\'adresse du lien</em>) pour partager cette recherche ou y acc&eacute;der &agrave; tout moment,' +
        ' et toujours avoir les r&eacute;sultats &agrave; jour.<br /><hr />Alternativement, ajoutez cette page &agrave; vos favoris (<kbd>Ctrl+D</kbd>) pour un acc&egrave;s rapide.<br /><br /><a href="' +
        $location.absUrl() + '">R&eacute;sultats de la recherche</a>'
    });
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
    $scope.departments = results[0];
    $scope.filter = helper.fromURIComponent($location.search().filter);
    $scope.certificates = _.filter(helper.fillUp(_.values(results[1]), $scope.filter.certificates), 'conditions');
    $scope.display = helper.fromURIComponent($location.search().display);
    $scope.$watch('filter', setSearchUrl, true);
    $scope.$watch('display', setSearchUrl, true);
    busySvc.done('sitesSearch');
  });
};
