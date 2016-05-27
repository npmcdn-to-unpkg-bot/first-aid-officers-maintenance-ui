'use strict';

var _ = require('lodash');
/*jshint camelcase: false*/

module.exports = function ($rootScope, $scope, $document, $location, ngDialog, dataSvc) {
  $scope.whereami = $location.host();
  $scope.title = $document[0].title;
  $scope.today = new Date();
  $scope.navbar = {};

  $scope.refreshIndex = function () {
    Promise.all([dataSvc.getTrainings(), dataSvc.getTrainingTypes()]).then(_.spread(function (trainings, trainingTypes) {
      $scope.trainingsIndex = _.sortBy(_.each(_.values(trainings), function (training) {
        training.type = trainingTypes[training.trng_trty_fk];
      }), function (training) {
        return training.trng_date;
      }).reverse();

      $scope.globalIndex = $scope.sitesIndex.concat($scope.employeesIndex).concat($scope.trainingsIndex);
    }));
  };

  $scope.refreshEntireIndex = function () {
    Promise.all([dataSvc.getSites(), dataSvc.getEmployees()]).then(function (results) {
      $scope.sitesIndex = _.values(results[0]);
      $scope.employeesIndex = _.values(results[1]);
      $scope.refreshIndex();
    });
  };
  $scope.refreshEntireIndex();
  $rootScope.$on('update', $scope.refreshEntireIndex);

  $rootScope.$watch('currentUser.info', function (userInfo) {
    $scope.userInfo = userInfo;
  }, true);
  $scope.$watch('navbar.select', function (select) {
    if (select !== undefined) {
      if (select.site_pk) {
        $location.path('/sites/' + select.site_pk);
        delete($scope.navbar.select);
      } else if (select.empl_pk) {
        $location.path('/employees/' + select.empl_pk);
        delete($scope.navbar.select);
      } else if (select.trng_pk) {
        $location.path('/trainings/' + select.trng_pk);
        delete($scope.navbar.select);
      }
    }
  });

  $scope.isActive = function (viewLocation) {
    return viewLocation === '/' ? viewLocation === $location.path() : $location.path().indexOf(viewLocation) === 0;
  };

  $scope.disconnect = function () {
    var dialogScope = $scope.$new(false);
    dialogScope.innerHtml = '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">vous d&eacute;connecter</span>&nbsp;?';
    ngDialog.closeAll();
    ngDialog.openConfirm({
      template: 'components/dialogs/warning.html',
      scope: dialogScope
    }).then(function () {
      $rootScope.disconnect();
    });
  };

  $scope.closeAlert = function (alert) {
    if ($scope.alerts.indexOf(alert) > -1) {
      $scope.alerts.splice($scope.alerts.indexOf(alert), 1);
    }
  };

  $scope.alertCallback = function (index) {
    return $scope.alerts[index].callback();
  };
};
