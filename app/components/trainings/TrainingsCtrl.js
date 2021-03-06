'use strict';
/*jshint camelcase: false*/

var _ = require('lodash');
var moment = require('moment');
var helper = require('./trainingsConditionsHelper.js');
var reports = require('../reports/trainingsReports.js');

module.exports = function ($scope, dataSvc, $location, busySvc, NgTableParams, ngDialog, clientSvc) {
  busySvc.busy('trainings');
  var init = true;

  $scope.cols = [
    { id: 'button', clazz: 'primary', on: 'hover', width: '1%', show: true },
    { title: 'Type de formation', id: 'type', sortable: 'type.trty_order', filter: { 'type.trty_name': 'select' }, field: 'type.trty_name', colspan: 2, width: '20%', show: true },
    { id: 'certs', align: 'right', hideHeader: true, width: '1%', show: true },
    { title: 'Date(s)', id: 'dates', sortable: 'trng_date', filter: { 'dates': 'text' }, field: 'trng_displayDate', show: true },
    { title: 'Date de d&eacute;but', sortable: 'trng_start', id: 'trng_start', show: false },
    { title: 'Date de fin', sortable: 'trng_date', id: 'trng_end', show: false },
    { title: 'Inscrits', sortable: 'registered', field: 'registered', id: 'registered', align: 'center', width: '1%', show: false },
    { title: 'Valid&eacute;s', sortable: 'validated', field: 'validated', id: 'validated', clazz: 'text-success', align: 'center', width: '1%', show: false },
    { title: 'Recal&eacute;s', sortable: 'flunked', field: 'flunked', id: 'flunked', clazz: 'text-danger', align: 'center', width: '1%', show: false }, {
      title: '&Eacute;tat',
      sortable: 'trng_outcome',
      filter: { trng_outcome: 'select' },
      id: 'trng_outcome',
      align: 'right',
      width: '1%',
      show: true,
      data: [{ title: 'Réalisée', id: 'COMPLETED' }, { title: 'Prévue', id: 'SCHEDULED' }]
    }
  ];

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
        if (!$scope.$$phase) {
          $scope.$digest();
        }
      }
    });
  };
  $scope.deleteDatesCondition = function () {
    delete $scope.datesCondition;
  };

  $scope.types = [];
  $scope.addTypes = function (option) {
    $scope.types = _.sortBy(_.uniq($scope.types.concat(option.type ? [option.type] : _.filter($scope.trainingTypes, function (trty) {
      return _.find(trty.certificates, { cert_pk: option.cert_pk });
    }))), 'trty_order');

    delete $scope.typeOption;
  };

  $scope.getFilterDisplay = function (key, value) {
    var col = _.find($scope.cols, function (col) {
      return _.find(col, key);
    });

    return _.extend({ title: col.title },
      (function () {
        switch (key) {
          case 'type.trty_name':
            return { link: 'est', value: value };
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
    $location.search(_($scope.tp.url()).mapKeys(_.flow(_.nthArg(1), decodeURI)).mapValues(decodeURIComponent).extend({
      dates: helper.toURIComponent($scope.datesCondition),
      types: _.map($scope.types, function (trty) {
        return trty.trty_pk;
      })
    }).omitBy(_.isEmpty).extendWith($scope.details, function (unused, bool) {
      return bool || null;
    }).value()).replace();
    setTimeout(function () {
      $scope.$apply(); // force $location to sync with the browser
    }, 0);
  }

  function filterTrainings() {
    var page = $scope.tp.parameters().page;
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

    if (init) {
      $scope.tp.parameters({ page: page });
    }
  }

  Promise.all([dataSvc.getTrainings(), dataSvc.getTrainingTypes(), dataSvc.getCertificates()]).then(_.spread(function (trainings, trainingTypes, certificates) {
    $scope.trainings = _.map(trainings, function (trng) {
      return _.extend(trng, {
        type: trainingTypes[trng.trng_trty_fk],
        dates: trng.trng_displayDate + ' ' + moment(trng.trng_date).format('DD/MM/YYYY') + ' ' + (trng.trng_start ? moment(trng.trng_start).format('DD/MM/YYYY') :
          '')
      });
    });

    _.find($scope.cols, { field: 'type.trty_name' }).data = _.map(_.orderBy(trainingTypes, 'trty_order'), function (type) {
      return {
        title: type.trty_name,
        id: type.trty_name
      };
    });

    $scope.typeOptions = _.map(trainingTypes, function (type) {
      return { display: type.trty_name, group: 'Type particulier', type: type };
    }).concat(_.map(certificates, function (cert) {
      return { display: cert.cert_short + ' - ' + cert.cert_name, group: 'Octroyant une certaine aptitude', cert_pk: cert.cert_pk };
    }));

    $scope.certificates = _.values(certificates);
    $scope.trainingTypes = trainingTypes;
    $scope.tp = new NgTableParams(_.mapValues(_.omit(_.extend({ sorting: { trng_date: 'desc' }, count: 10 }, $location.search()), ['dates', 'types']), function (val) {
      return _.isString(val) ? decodeURI(val) : val;
    }), {
      filterDelay: 0,
      defaultSort: 'asc',
      dataset: $scope.trainings
    });

    $scope.$watch('datesCondition', filterTrainings);
    $scope.$watchCollection('types', filterTrainings);
    $scope.$watch('details', showColumns, true);

    $scope.$apply(); // force $location to sync with the browser
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
      init = false;
    }, 0);
  }), _.partial(busySvc.done, 'trainings'));

  $scope.export = function () {
    var data = $scope.tp.settings().getData(new NgTableParams($scope.tp.parameters(), {
      dataOptions: { applyPaging: false },
      dataset: $scope.tp.settings().dataset
    }));

    ngDialog.open({
      template: './components/dialogs/export_options.html',
      scope: _.extend($scope.$new(), {
        tooLong: data.length > 1000,
        callback: function (params, close) {
          busySvc.busy('report', true);
          Promise.all([clientSvc.getClientInfo(), clientSvc.getBase64Logo()]).then(_.spread(function (info, logo) {
            var report;
            if (params.pdf) {
              report = reports.generatePDF(params, {
                  title: 'Extraction des Formations - ' + moment().format('DD/MM/YYYY'),
                  author: 'Generated by ' + $location.host(),
                  logo: logo,
                  mailto: info.clnt_mailto,
                  url: $location.absUrl()
                }, $scope.datesCondition, _.map(
                  _.omitBy($scope.tp.filter(), _.overSome(_.isNil, _.partial(_.isEqual, _, ''))),
                  _.rearg($scope.getFilterDisplay, [1, 0])),
                $scope.types, $scope.cols, _.take(data, 1000));
            } else {
              report = reports.generateXLSX(
                _($scope.cols).filter(params.columns === 'all' ? _.stubTrue : 'show').reject({ id: 'button' }).reject({ id: 'certs' }).value(), data);
            }

            report.download(moment().format('YYYY-MM-DD') + ' - Extraction des Formations' + (params.pdf ? '.pdf' : '.xlsx'));
            busySvc.done('report');
            close();
          }));
        }
      })
    });
  };

  $scope.getLink = function () {
    $scope.$emit('alert', {
      type: 'primary',
      msg: 'Utilisez le lien ci-dessous (clic droit, puis <em>Copier l\'adresse du lien</em>) pour partager cette recherche ou y acc&eacute;der &agrave; tout moment,' +
        ' et avoir des r&eacute;sultats <strong>toujours &agrave; jour</strong>.<br /><hr />Alternativement, ajoutez cette page &agrave; vos favoris (<kbd>Ctrl+D</kbd>) pour un acc&egrave;s rapide.<br /><br /><a href="' +
        $location.absUrl() + '">R&eacute;sultats de la recherche</a>',
      static: true
    });
  };

  $scope.select = function (trng_pk) {
    $location.path('/trainings/' + trng_pk).search({});
  };
};
