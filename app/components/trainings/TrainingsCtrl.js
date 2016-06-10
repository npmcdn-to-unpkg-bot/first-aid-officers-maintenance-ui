'use strict';
/*jshint camelcase: false*/

var _ = require('lodash');
var helper = require('./trainingsConditionsHelper.js');

module.exports = function ($scope, dataSvc, $location, busySvc, NgTableParams, ngDialog) {
  busySvc.busy('trainings');

  $scope.cols = [{
    id: 'button',
    clazz: 'primary',
    on: 'hover',
    width: '1%',
    show: true
  }, {
    title: 'Type de formation',
    sortable: 'type.trty_order',
    filter: {
      'type.trty_pk': 'select'
    },
    field: 'type.trty_name',
    colspan: 2,
    width: '20%',
    show: true
  }, {
    id: 'certs',
    align: 'right',
    hideHeader: true,
    width: '1%',
    show: true
  }, {
    title: 'Date(s)',
    sortable: 'trng_date',
    field: 'trng_displayDate',
    show: true
  }, {
    title: 'Date de d&eacute;but',
    sortable: 'trng_start',
    id: 'trng_start',
    show: false
  }, {
    title: 'Date de fin',
    sortable: 'trng_date',
    id: 'trng_end',
    show: false
  }, {
    title: 'Inscrits',
    sortable: 'registered',
    field: 'registered',
    align: 'center',
    width: '1%',
    show: false
  }, {
    title: 'Valid&eacute;s',
    sortable: 'validated',
    field: 'validated',
    clazz: 'text-success',
    align: 'center',
    width: '1%',
    show: false
  }, {
    title: 'Recal&eacute;s',
    sortable: 'flunked',
    field: 'flunked',
    clazz: 'text-danger',
    align: 'center',
    width: '1%',
    show: false
  }, {
    title: '&Eacute;tat',
    sortable: 'trng_outcome',
    filter: {
      trng_outcome: 'select'
    },
    data: [{ title: 'Réalisée', id: 'COMPLETED' }, { title: 'Prévue', id: 'SCHEDULED' }],
    id: 'trng_outcome',
    align: 'right',
    width: '1%',
    show: true
  }];

  $scope.datesOptions = helper.datesOptions;
  $scope.addDateContition = function (dateOption) {
    ngDialog.open({
      template: './components/dialogs/trainings_dates_selection.html',
      scope: _.extend($scope.$new(), {
        dateOption: dateOption,
        isValid: helper.isValid,
        submit: function (params) {
          $scope.datesCondition = _.extend(params, { option: dateOption });
        }
      }),
      preCloseCallback: function () {
        delete $scope.dateOption;
      }
    });
  };
  $scope.deleteDatesCondition = function () {
    delete $scope.datesCondition;
  };

  $scope.types = [];
  $scope.addTypes = function (typeOption) {
    ngDialog.open({
      template: './components/dialogs/trainings_types_selection.html',
      scope: _.extend($scope.$new(), {
        typeOption: typeOption,
        submit: function (type) {
          $scope.types = _.sortBy(_.uniq($scope.types.concat(typeOption === 'trty' ? [type] : _.filter($scope.trainingTypes, function (trty) {
            return _.find(trty.certificates, { cert_pk: type });
          }))), 'trty_order');
        }
      }),
      preCloseCallback: function () {
        delete $scope.typeOption;
      }
    });
  };

  $scope.getFilterDisplay = function (key, value) {
    var col = _.find($scope.cols, function (col) {
      return _.find(col, key);
    });

    return _.extend({ title: col.title },
      (function () {
        switch (key) {
          case 'type.trty_pk':
            return { link: 'est', value: _.find($scope.trainingTypes, { trty_pk: value }).trty_name };
          case 'trng_outcome':
            return { link: 'est', value: _.find(col.data, { id: value }).title };
          default:
            return { value: value };
        }
      }()));
  };

  function showColumns() {
    _.each($scope.details, function showColumn(show, id) {
      var col = _.find($scope.cols, { id: id }) || _.find($scope.cols, { field: id });
      col.show = show;
      if (id === 'trng_start') {
        showColumn(show, 'trng_end');
        showColumn(!show, 'trng_displayDate');
      }
    });
  }

  function updateSearch() {
    $location.search(_($scope.tp.url()).mapKeys(_.flow(_.nthArg(1), decodeURI)).extend({
      dates: helper.toURIComponent($scope.datesCondition),
      types: _.map($scope.types, function (trty) {
        return trty.trty_pk;
      })
    }).omitBy(_.isEmpty).extendWith($scope.details, function (unused, bool) {
      return bool || null;
    }).value()).replace();
  }

  function filterTrainings() {
    $scope.tp.settings({
      dataset: _($scope.trainings).thru(function (trainings) {
        return $scope.types.length === 0 ? trainings : _.filter(trainings, function (trng) {
          return _.some($scope.types, function (type) {
            return trng.trng_trty_fk === type.trty_pk;
          });
        });
      }).thru(function (trainings) {
        return $scope.datesCondition ? _.filter(trainings, _.partial(helper.testCondition, _, $scope.datesCondition)) : trainings;
      }).value()
    });
  }

  Promise.all([dataSvc.getTrainings(), dataSvc.getTrainingTypes(), dataSvc.getCertificates()]).then(_.spread(function (trainings, trainingTypes, certificates) {
    $scope.trainings = _.values(trainings);
    _.each(trainings, function (training) {
      training.type = trainingTypes[training.trng_trty_fk];
    });

    _.find($scope.cols, { field: 'type.trty_name' }).data = _.map(_.orderBy(trainingTypes, 'trty_order'), function (type) {
      return {
        title: type.trty_name,
        id: type.trty_pk
      };
    });

    $scope.certificates = _.values(certificates);
    $scope.trainingTypes = _.values(trainingTypes);
    $scope.tp = new NgTableParams(_.omit(_.extend({ sorting: { trng_date: 'desc' }, count: 10 }, $location.search()), 'dates'), {
      filterDelay: 0,
      defaultSort: 'asc',
      dataset: $scope.trainings
    });

    $scope.$watch('datesCondition', filterTrainings);
    $scope.$watchCollection('types', filterTrainings);
    $scope.$watch('details', showColumns, true);

    $scope.$watch('details', updateSearch, true);
    $scope.$watch('datesCondition', updateSearch);
    $scope.$watchCollection('types', updateSearch);
    $scope.$watch(function () {
      return JSON.stringify(_.mapKeys($scope.tp.url(), _.flow(_.nthArg(1), decodeURI)));
    }, updateSearch);

    $scope.datesCondition = helper.fromURIComponent($location.search().dates);
    $scope.types = _.map($location.search().types, _.partial(_.get, trainingTypes));
    $scope.details = _.pick($location.search(), ['registered', 'validated', 'flunked', 'trng_start']);
    busySvc.done('trainings');
    setTimeout(function () {
      $scope.advancedSearch = !_.isUndefined($scope.datesCondition) || $scope.types.length > 0;
      $scope.$apply();
    }, 0);
  }), _.partial(busySvc.done, 'trainings'));

  $scope.select = function (trng_pk) {
    $location.path('/trainings/' + trng_pk);
  };
};
