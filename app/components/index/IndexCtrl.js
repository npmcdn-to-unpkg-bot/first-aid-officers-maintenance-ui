'use strict';

var _ = require('lodash');
/*jshint camelcase: false*/

module.exports = function ($rootScope, $scope, $document, $location, ngDialog, dataSvc) {
  $scope.whereami = $location.host();
  $scope.title = $document[0].title;
  $scope.today = new Date();
  $scope.navbar = {};

  $scope.closeAlert = function (alert) {
    if ($rootScope._alerts.indexOf(alert) > -1) {
      $rootScope._alerts.splice($rootScope._alerts.indexOf(alert), 1);
    }
  };

  $scope.alertCallback = function (index) {
    return $rootScope._alerts[index].callback();
  };

  $rootScope._alerts = [];
  $rootScope.$on('alert', function (event, alert) { $rootScope._alerts.push(_.extend(alert, { id: $rootScope._alerts.length })); });
  $rootScope.$on('error', function () {
    $rootScope._alerts.push({
      type: 'danger',
      msg: 'Une erreur est survenue. Merci de bien vouloir r&eacute;essayer ult&eacute;rieurement.\nSi le probl&egrave;me persiste, contactez un administrateur de la solution.',
      static: true,
      id: $rootScope._alerts.length
    });
  });

  $rootScope.hasRole = function (role) {
    if (!($rootScope.currentUser && $rootScope.currentUser.info && $rootScope.currentUser.info.roles)) {
      return !role;
    }

    var test = /(!)?([a-z]+)(\d)?$/.exec(role);
    var res = (function (roles, role, level) {
      return roles[role] && (level ? roles[role] >= level : true);
    })($rootScope.currentUser.info.roles, test[2], test[3]);

    return test[1] ? !res : !!res;
  };

  $scope.refreshIndex = function () {
    if ($rootScope.hasRole('access4')) {
      Promise.all([dataSvc.getTrainings(), dataSvc.getTrainingTypes()]).then(_.spread(function (trainings, trainingTypes) {
        $scope.trainingsIndex = _.sortBy(_.each(_.values(trainings), function (training) {
          training.type = trainingTypes[training.trng_trty_fk];
        }), function (training) {
          return training.trng_date;
        }).reverse();

        $scope.globalIndex = $scope.sitesIndex.concat($scope.employeesIndex).concat($scope.trainingsIndex);
      }));
    } else {
      $scope.globalIndex = $scope.sitesIndex.concat($scope.employeesIndex);
    }
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
        $location.path('/sites/' + select.site_pk).search({});
        delete($scope.navbar.select);
      } else if (select.empl_pk) {
        $location.path('/employees/' + select.empl_pk).search({});
        delete($scope.navbar.select);
      } else if (select.trng_pk) {
        $location.path('/trainings/' + select.trng_pk).search({});
        delete($scope.navbar.select);
      }
    }
  });

  $scope.isActive = function (viewLocation) {
    return viewLocation === '/' ? viewLocation === $location.path() : $location.path().indexOf(viewLocation) === 0;
  };

  $scope.disconnect = function () {
    ngDialog.closeAll();
    ngDialog.openConfirm({
      template: 'components/dialogs/warning.html',
      scope: _.extend($scope.$new(false), {
        _title: 'D&eacute;connection',
        innerHtml: '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">vous d&eacute;connecter</span>&nbsp;?'
      })
    }).then(function () {
      $rootScope.disconnect();
    });
  };
};
