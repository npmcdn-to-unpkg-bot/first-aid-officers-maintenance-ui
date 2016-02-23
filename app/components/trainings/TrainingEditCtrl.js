'use strict';
/*jshint camelcase: false*/

var _ = require('underscore');
var moment = require('moment');

module.exports = function ($scope, $rootScope, $routeParams, dataSvc, trngSvc, $location, ngDialog, dateFilter, busySvc) {
  busySvc.busy();

  Promise.all([dataSvc.getSites(), dataSvc.getEmployees(), dataSvc.getTrainingTypes()]).then(function (results) {
    $scope.sites = _.values(results[0]);
    $scope.employees = results[1];
    $scope.trainingTypes = _.values(results[2]);
    $scope.trainees = [];
    if ($routeParams.trng_pk) {
      dataSvc.getTraining($routeParams.trng_pk).then(function (training) {
        $scope.dateRange = training.trng_start !== null;
        training.type = results[2][training.trng_trty_fk];
        $scope.trng = training;
        $scope.trng.trng_start = new Date($scope.trng.trng_start);
        $scope.trng.trng_date = new Date($scope.trng.trng_date);
        $scope.trainees = _.values(training.trainees);
        busySvc.done();
      }, function () {
        busySvc.done();
      });
    } else {
      $scope.trng = { trainers: [] };
      busySvc.done();
    }

    $scope.$apply();
  }, function () {
    busySvc.done();
  });

  $scope.getDisplayDate = function () {
    if ($scope.dateRange && $scope.trng.trng_start) {
      var dateFromFormat;
      if (dateFilter($scope.trng.trng_start, 'yyyy') !== dateFilter($scope.trng.trng_date, 'yyyy')) {
        dateFromFormat = 'longDate';
      } else {
        dateFromFormat = dateFilter($scope.trng.trng_start, 'M') === dateFilter($scope.trng.trng_date, 'M') ? 'd' : 'd MMMM';
      }

      return 'du ' + dateFilter($scope.trng.trng_start, dateFromFormat) + ' au ' + dateFilter($scope.trng.trng_date, 'longDate');
    }

    return dateFilter($scope.trng.trng_date, 'fullDate');
  };

  $scope.$watch('trng.trng_date', function (date) {
    if ($scope.trng && $scope.trng.type) {
      $scope.trng.expirationDate = moment(date).add($scope.trng.type.trty_validity, 'months').format('YYYY-MM-DD');
    }
  });

  $scope.$watch('trng.type.trty_validity', function (validity) {
    if ($scope.trng) {
      $scope.trng.validity = moment.duration(validity, 'months').asYears();
      if ($scope.trng.trng_date) {
        $scope.trng.expirationDate = moment($scope.trng.trng_date).add(validity, 'months').format('YYYY-MM-DD');
      }
    }
  });

  $scope.$watch('empl', function (empl) {
    if (empl && empl.empl_pk && _.findWhere($scope.trng.trainers, { empl_pk: empl.empl_pk }) === undefined) {
      $scope.trng.trainers.push(empl);
      delete $scope.empl;
    }
  });

  $scope.unregister = function (empl) {
    var dialogScope = $scope.$new(true);
    dialogScope.innerHtml = '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">d&eacute;sinscrire<br />' + empl.empl_firstname + ' ' + empl.empl_surname + '</span> de cette formation&nbsp?';
    ngDialog.openConfirm({
      template: 'components/dialogs/warning.html',
      scope: dialogScope
    }).then(function () {
      $scope.trainees.splice($scope.trainees.indexOf(empl), 1);
    });
  };

  $scope.selectEmployee = function (empl_pk) {
    $location.path('/employees/' + empl_pk);
  };

  $scope.disabled = function (date, mode) {
    return mode === 'day' && (date.getDay() === 0 || date.getDay() === 6);
  };

  $scope.registerAgents = function () {
    ngDialog.open({
      template: 'components/dialogs/register_employees.html',
      scope: $scope,
      controller: ['$scope', 'DataSvc', function ($scope, dataSvc) {
        $scope.$watch('empl', function (empl) {
          if (empl) {
            $scope.alreadyRegistered = _.contains(_.pluck($scope.trainees, 'empl_pk'), empl.empl_pk);
          }
        });

        function registerEmpl(empl) {
          if (!_.contains(_.pluck($scope.trainees, 'empl_pk'), empl.empl_pk)) {
            $scope.trainees.push(empl);
          }
        }

        $scope.register = function () {
          if ($scope.mode) {
            registerEmpl($scope.empl);
            delete($scope.empl);
          } else {
            $scope.loading = true;
            dataSvc.getSiteEmployees($scope.site.site_pk).then(function (employees) {
              _.each(employees, registerEmpl);
              $scope.loading = false;
            });

            delete($scope.site);
          }
        };
      }]
    });
  };

  $scope.save = function () {
    var dialogScope = $scope.$new(true);
    dialogScope.innerHtml = '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">' + (($routeParams.trng_pk) ? 'enregistrer les modifications apport&eacute;es</span> &agrave' : 'cr&eacute;er</span>') + ' cette formation&nbsp?';
    ngDialog.openConfirm({
      template: 'components/dialogs/warning.html',
      scope: dialogScope
    }).then(function () {
      var training = {
        trng_trty_fk: $scope.trng.type.trty_pk,
        trng_start: $scope.dateRange ? dateFilter($scope.trng.trng_start, 'yyyy-MM-dd') : null,
        trng_date: dateFilter($scope.trng.trng_date, 'yyyy-MM-dd'),
        trng_outcome: $scope.trng.trng_outcome || 'SCHEDULED',
        trng_comment: $scope.trng.trng_comment && $scope.trng.trng_comment.length > 0 ? $scope.trng.trng_comment : null,
        trainers: _.pluck($scope.trng.trainers, 'empl_pk'),
        trainees: _.object(_.pluck($scope.trainees, 'empl_pk'), _.map($scope.trainees, function (trainee) {
          return _.defaults(trainee, { trem_outcome: 'SCHEDULED', trem_comment: '' });
        })) || _.object(_.pluck($scope.trainees, 'empl_pk'), _.map($scope.trainees, function () {
          return { trem_outcome: 'SCHEDULED' };
        }))
      };

      var promise;
      if ($scope.trng.trng_pk) {
        promise = trngSvc.updateTraining($scope.trng.trng_pk, training);
      } else {
        promise = trngSvc.createTraining(training);
      }

      promise.then(function (trng_pk) {
        $rootScope.alerts.push({ type: 'success', msg: $scope.trng.trng_pk ? 'Formation mise &agrave; jour.' : 'Formation cr&eacute;&eacute;e.' });
        $location.path('/trainings/' + ($scope.trng.trng_pk || trng_pk)).search('force', true);
      });
    });
  };

  $scope.cancel = function () {
    var dialogScope = $scope.$new(true);
    dialogScope.innerHtml = '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">annuler la cr&eacute;ation/modification</span> de cette formation&nbsp?<hr />En confirmant, toutes les modifications qui n\'ont pas &eacute;t&eacute; sauvegard&eacute;es seront perdues.';
    ngDialog.openConfirm({
      template: 'components/dialogs/warning.html',
      scope: dialogScope
    }).then(function () {
      if ($scope.trng && $scope.trng.trng_pk) {
        $location.path('/trainings/' + $scope.trng.trng_pk).search('force', true);
      } else {
        $location.path('/home').search('force', true);
      }
    });
  };
};
