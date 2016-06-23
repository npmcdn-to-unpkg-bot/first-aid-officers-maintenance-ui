'use strict';
/*jshint camelcase: false*/

var _ = require('lodash');
var moment = require('moment');
var reports = require('../reports/trainingsReports.js');

module.exports = function ($scope, $routeParams, dataSvc, trngSvc, $location, ngDialog, busySvc, dateFilter, NgTableParams) {
  busySvc.busy('training');

  $scope.cols = [
    { id: 'button', clazz: 'primary', on: 'hover', show: true, width: '1%' },
    { title: 'Matricule', sortable: 'empl_pk', filter: { empl_pk: 'text' }, field: 'empl_pk', show: true, width: '1%' },
    { title: 'Titre', sortable: 'empl_gender', id: 'empl_gender', align: 'right', show: true, width: '1%' },
    { title: 'Nom', sortable: 'empl_surname', filter: { empl_surname: 'text' }, id: 'empl_surname', shrinkable: true, show: true, width: '15%' },
    { title: 'Pr&eacute;nom', sortable: 'empl_firstname', filter: { empl_firstname: 'text' }, id: 'empl_firstname', shrinkable: true, show: true, width: '15%' },
    { title: 'Statut', sortable: 'empl_permanent', id: 'empl_permanent', align: 'center', show: true, width: '1%' },
    { title: 'Commentaire', sortable: 'trem_comment', field: 'trem_comment', show: true }, {
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

  Promise.all([dataSvc.getTraining($routeParams.trng_pk), dataSvc.getTrainingTypes(), dataSvc.getCertificates()]).then(_.spread(function (trng, trainingTypes, certificates) {
    $scope.trng = _.extend(trng, {
      type: trainingTypes[trng.trng_trty_fk],
      expirationDate: moment(trng.trng_date).add(trainingTypes[trng.trng_trty_fk].trty_validity, 'months').format('YYYY-MM-DD'),
      validity: moment.duration(trainingTypes[trng.trng_trty_fk].trty_validity, 'months').asYears(),
      displayDate: (function () {
        if (trng.trng_start) {
          var dateFromFormat;
          if (dateFilter(trng.trng_start, 'yyyy') !== dateFilter(trng.trng_date, 'yyyy')) {
            dateFromFormat = 'longDate';
          } else {
            dateFromFormat = dateFilter(trng.trng_start, 'M') === dateFilter(trng.trng_date, 'M') ? 'd' : 'd MMMM';
          }

          return 'du ' + dateFilter(trng.trng_start, dateFromFormat) + ' au ' + dateFilter(trng.trng_date, 'longDate');
        }

        return dateFilter(trng.trng_date, 'fullDate');
      })()
    });

    $scope.tp = new NgTableParams(_({ sorting: { empl_surname: 'asc' }, count: 10 }).extend($location.search()).mapValues(function (val) {
      return _.isString(val) ? decodeURI(val) : val;
    }).value(), {
      filterDelay: 0,
      defaultSort: 'asc',
      dataset: $scope.trainees = _.values(trng.trainees)
    });

    $scope.$apply(); // force $location to sync with the browser
    $scope.$watch(function () {
      return JSON.stringify(_.mapKeys($scope.tp.url(), _.flow(_.nthArg(1), decodeURI)));
    }, function () {
      $location.search(_.mapValues(_.mapKeys($scope.tp.url(), _.flow(_.nthArg(1), decodeURI)), decodeURIComponent)).replace();
    });

    $scope.certificates = _.values(certificates);
    busySvc.done('training');
  }), _.partial(busySvc.done, 'training'));

  $scope.canComplete = function () {
    return $scope.trainees && $scope.trainees.length > 0 && moment($scope.trng.trng_date).isSameOrBefore(new Date());
  };

  $scope.export = function () {
    var exportType = ' - ' + _.unescape($scope.trng.trng_outcome === 'COMPLETED' ? 'Proc&egrave;s Verbal' : 'Feuille d\'&eacute;margement');
    var data = $scope.tp.settings().getData(new NgTableParams($scope.tp.parameters(), {
      dataOptions: { applyPaging: false, applyFilter: false },
      dataset: $scope.tp.settings().dataset
    }));

    ngDialog.open({
      template: './components/dialogs/export_options_pdf.html',
      scope: _.extend($scope.$new(false), {
        callback: function (params, close) {
          busySvc.busy('report', true);
          reports
            .generateSignInSheet(params, { title: $scope.trng.type.trty_name + ' - ' + $scope.trng.displayDate + exportType, author: 'Generated by ' + $location.host() },
              $location.absUrl().substring(0, $location.absUrl().indexOf('?')), $scope.trng, data)
            .download(moment($scope.trng.trng_date).format('YYYY-MM-DD') + ' - ' + $scope.trng.type.trty_name + exportType + '.pdf');
          busySvc.done('report');
          close();
        }
      })
    });
  };

  $scope.selectEmployee = function (empl_pk) {
    $location.path('/employees/' + empl_pk).search({});
  };

  $scope.edit = function () {
    $location.path('/trainings/' + $scope.trng.trng_pk + '/edit').search({});
  };

  $scope.complete = function () {
    $location.path('/trainings/' + $scope.trng.trng_pk + '/complete').search({});
  };

  $scope.delete = function () {
    var dialogScope = $scope.$new(true);
    dialogScope.innerHtml =
      '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">supprimer d&eacute;finitivement</span> cette formation&nbsp? Cette op&eacute;ration est irr&eacute;versible et prend effet imm&eacute;diatement.';
    ngDialog.openConfirm({
      template: 'components/dialogs/warning.html',
      scope: dialogScope
    }).then(function () {
      trngSvc.deleteTraining($scope.trng.trng_pk).then(function () {
        $scope.$emit('alert', {
          type: 'success',
          msg: 'Formation effac&eacute;e.'
        });

        $location.path('/trainings').search({});
      });
    });
  };
};
