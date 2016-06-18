'use strict';
/*jshint camelcase: false*/

var _ = require('lodash');
var moment = require('moment');

module.exports = function ($scope, $routeParams, dataSvc, trngSvc, $location, ngDialog, dateFilter, busySvc, NgTableParams) {
  busySvc.busy('trainingEdit');
  busySvc.busy('ongoingOperation', true);

  $scope.cols = [
    { id: 'button', clazz: 'danger', on: 'hover', show: true, width: '1%' },
    { title: 'Matricule', sortable: 'empl_pk', filter: { empl_pk: 'text' }, field: 'empl_pk', show: true, width: '1%' },
    { title: 'Titre', sortable: 'empl_gender', id: 'empl_gender', align: 'right', show: true, width: '1%' },
    { title: 'Nom', sortable: 'empl_surname', filter: { empl_surname: 'text' }, id: 'empl_surname', shrinkable: true, show: true, width: '15%' },
    { title: 'Pr&eacute;nom', sortable: 'empl_firstname', filter: { empl_firstname: 'text' }, id: 'empl_firstname', shrinkable: true, show: true, width: '15%' },
    { title: 'Statut', sortable: 'empl_permanent', id: 'empl_permanent', align: 'center', show: true, width: '1%' }, {
      id: 'trem_outcome',
      title: 'R&eacute;sultat',
      sortable: 'trem_outcome',
      filter: {
        trem_outcome: 'select'
      },
      data: [{ title: _.unescape('Valid&eacute;(e)'), id: 'VALIDATED' }, { title: _.unescape('Non valid&eacute;(e)'), id: 'FLUNKED' }, { title: 'En attente', id: 'SCHEDULED' }],
      show: true,
      width: '1%',
      align: 'right'
    }
  ];

  Promise.all([dataSvc.getSites(), dataSvc.getEmployees(), dataSvc.getTrainingTypes()].concat($routeParams.trng_pk ? [dataSvc.getTraining($routeParams.trng_pk)] : []))
    .then(_.spread(function (sites, employees, trainingTypes, trng) {
      $scope.employees = employees;
      $scope.trainingTypes = _.values(trainingTypes);
      if (trng) {
        $scope.trng = _.extend(trng, {
          type: trainingTypes[trng.trng_trty_fk],
          trng_start: $scope.dateRange = !!trng.trng_start ? new Date(trng.trng_start) : undefined,
          trng_date: new Date(trng.trng_date),
          trainees: _.values(trng.trainees)
        });
      } else {
        $scope.trng = { trainers: [], trainees: [] };
      }

      $scope.tp = new NgTableParams(_({ sorting: { empl_surname: 'asc' }, count: 10 }).extend($location.search()).mapValues(function (val) {
        return _.isString(val) ? decodeURI(val) : val;
      }).value(), {
        filterDelay: 0,
        defaultSort: 'asc',
        dataset: $scope.trainees = $scope.trng.trainees
      });

      $scope.$watchCollection('trainees', function () {
        $scope.tp.reload();
      });

      busySvc.done('trainingEdit');
    }), _.partial(busySvc.done, 'trainingEdit'));

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

  $scope.$watch('trng.trng_start', function () {
    if ($scope.trng && $scope.trng.trng_start === null) {
      delete $scope.trng.trng_start;
    }
  });

  $scope.$watch('trng.trng_date', function (date) {
    if ($scope.trng && $scope.trng.trng_date === null) {
      delete $scope.trng.trng_date;
    }

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
    if (empl && empl.empl_pk && !_.find($scope.trng.trainers, { empl_pk: empl.empl_pk })) {
      $scope.trng.trainers.push(empl);
      delete $scope.empl;
    }
  });

  $scope.unregister = function (empl) {
    $scope.$emit('alert', {
      type: 'primary',
      msg: '<b>' + (empl.empl_gender ? 'M.' : 'Mme') + ' ' + empl.empl_surname + ' ' + empl.empl_firstname +
        '</b> a &eacute;t&eacute; d&eacute;sinscrit(e) de la formation.',
      callback: function () {
        $scope.trainees.push(empl);
        return true; // dismiss alert
      }
    });

    $scope.trainees.splice($scope.trainees.indexOf(empl), 1);
  };

  $scope.registerAgents = function () {
    ngDialog.open({
      template: 'components/dialogs/register_employees.html',
      scope: $scope,
      controller: ['$scope', 'DataSvc', function ($scope, dataSvc) {
        $scope.$watch('empl', function (empl) {
          if (empl) {
            $scope.alreadyRegistered = _.includes(_.map($scope.trainees, 'empl_pk'), empl.empl_pk);
          }
        });

        function registerEmpl(empl) {
          if (!_.find($scope.trainees, { empl_pk: empl.empl_pk })) {
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
    ngDialog.openConfirm({
      template: 'components/dialogs/warning.html',
      scope: _.extend($scope.$new(true), {
        innerHtml: '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">' + (($routeParams.trng_pk) ?
          'enregistrer les modifications apport&eacute;es</span> &agrave' : 'cr&eacute;er</span>') + ' cette formation&nbsp?'
      })
    }).then(function () {
      var training = {
        trng_trty_fk: $scope.trng.type.trty_pk,
        trng_start: $scope.dateRange ? dateFilter($scope.trng.trng_start, 'yyyy-MM-dd') : null,
        trng_date: dateFilter($scope.trng.trng_date, 'yyyy-MM-dd'),
        trng_outcome: $scope.trng.trng_outcome || 'SCHEDULED',
        trng_comment: $scope.trng.trng_comment && $scope.trng.trng_comment.length > 0 ? $scope.trng.trng_comment : null,
        trainers: _.map($scope.trng.trainers, 'empl_pk'),
        trainees: _.keyBy(_.map($scope.trainees, function (trainee) {
          return _.extend({ trem_outcome: 'SCHEDULED', trem_comment: '' }, trainee);
        }), 'empl_pk')
      };

      ($scope.trng.trng_pk ? trngSvc.updateTraining($scope.trng.trng_pk, training) : trngSvc.createTraining(training)).then(function (trng_pk) {
        busySvc.done('ongoingOperation');
        $scope.$emit('alert', { type: 'success', msg: $scope.trng.trng_pk ? 'Formation mise &agrave; jour.' : 'Formation cr&eacute;&eacute;e.' });
        $location.path('/trainings/' + ($scope.trng.trng_pk || trng_pk));
      });
    });
  };

  $scope.cancel = function () {
    ngDialog.openConfirm({
      template: 'components/dialogs/warning.html',
      scope: _.extend($scope.$new(true), { innerHtml: '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">annuler la cr&eacute;ation/modification</span> de cette formation&nbsp?<hr />En confirmant, toutes les modifications qui n\'ont pas &eacute;t&eacute; sauvegard&eacute;es seront perdues.' })
    }).then(function () {
      busySvc.done('ongoingOperation');
      if ($scope.trng && $scope.trng.trng_pk) {
        $location.path('/trainings/' + $scope.trng.trng_pk);
      } else {
        $location.path('/home');
      }
    });
  };
};
