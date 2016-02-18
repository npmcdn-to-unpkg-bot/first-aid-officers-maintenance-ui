'use strict';

var _ = require('underscore');
var introJs = require('intro').introJs

/*jshint camelcase: false*/

module.exports = function ($rootScope, $scope, $document, $location, ngDialog, dataSvc, busySvc) {
  $scope.whereami = $location.host();
  $scope.title = $document[0].title;
  $scope.today = new Date();

  $scope.refreshIndex = function () {
    dataSvc.getTrainings().then(function (trainings) {
      $scope.trainingsIndex = _.sortBy(_.each(_.values(trainings), function (training) {
        training.type = $scope.trainingTypes[training.trng_trty_fk];
      }), function (training) {
        return training.trng_date;
      }).reverse();

      $scope.globalIndex = $scope.sitesIndex.concat($scope.employeesIndex).concat($scope.trainingsIndex);
    });
  };

  function clearHover() {
    _.each(document.getElementsByClassName('side-panel-container'), function (elem) {
      elem.classList.remove('hover');
    });
  };
  $scope.help = function () {
    busySvc.register(function (busy, unregister) {
      if (!busy) {
        setTimeout(function () {
          introJs().setOptions({
              nextLabel: 'Suivant',
              prevLabel: 'Pr&eacute;c&eacute;dent',
              skipLabel: 'Fermer',
              doneLabel: 'Termin&eacute;',
              showBullets: false
            }).onchange(function (targetElement) {
              if (targetElement.className.indexOf('side-panel-container') === -1) {
                clearHover();
              } else {
                targetElement.classList.add('hover');
              }
            }).onexit(clearHover)
            .oncomplete(clearHover).start();
        }, 0);
        unregister();
      }
    });
  };

  $scope.refreshEntireIndex = function () {
    Promise.all([dataSvc.getSites(), dataSvc.getEmployees(), dataSvc.getTrainingTypes()]).then(function (results) {
      $scope.sitesIndex = _.values(results[0]);
      $scope.employeesIndex = _.values(results[1]);
      $scope.trainingTypes = results[2];
      $scope.refreshIndex();
    });
  };
  $scope.refreshEntireIndex();
  $rootScope.$on('update', $scope.refreshEntireIndex);

  $rootScope.$watch('currentUser.info', function (userInfo) {
    $scope.userInfo = userInfo;
  }, true);
  $scope.$watch('select', function (select) {
    if (select !== undefined) {
      if (select.site_pk) {
        $location.path('/sites/' + select.site_pk);
        delete($scope.select);
      } else if (select.empl_pk) {
        $location.path('/employees/' + select.empl_pk);
        delete($scope.select);
      } else if (select.trng_pk) {
        $location.path('/trainings/' + select.trng_pk);
        delete($scope.select);
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

  $scope.closeAlert = function (index) {
    $scope.alerts.splice(index, 1);
  };
};
