'use strict';
/*jshint camelcase: false*/

var _ = require('underscore');

module.exports = function ($scope, $location, dataSvc, busySvc) {
  busySvc.busy();

  Promise.all([dataSvc.getCertificates(), dataSvc.getSites(), dataSvc.getEmployeesWithStats()]).then(function (results) {
    $scope.certificates = _.values(results[0]);
    $scope.sites = results[1];
    $scope.employees = _.values(_.each(results[2], function (empl) {
      empl.site = $scope.sites[empl.siem_site_fk];
    }));

    busySvc.done();
    $scope.$apply();
  }, function () {
    busySvc.done();
  });

  $scope.$watch('viewEmpl', function (viewEmpl) {
    if (viewEmpl !== undefined && viewEmpl.empl_pk) {
      $scope.select(viewEmpl.empl_pk);
      delete($scope.viewEmpl);
    }
  });

  $scope.select = function (empl_pk) {
    $location.path('/employees/' + empl_pk);
  };

  $scope.selectSite = function (site_pk) {
    $location.path('/sites/' + site_pk);
  };
};
