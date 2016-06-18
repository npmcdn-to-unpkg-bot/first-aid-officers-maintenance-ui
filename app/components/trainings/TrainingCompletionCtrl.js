'use strict';
/*jshint camelcase: false*/

var _ = require('lodash');
var moment = require('moment');

module.exports = function ($scope, $routeParams, dataSvc, $location, ngDialog, trainingsSvc, busySvc, dateFilter, NgTableParams) {
  busySvc.busy('trainingCompletion');
  busySvc.busy('ongoingOperation', true);

  $scope.cols = [
    { id: 'button', clazz: 'danger', on: 'hover', show: true, width: '1%' },
    { title: 'Matricule', sortable: 'empl_pk', filter: { empl_pk: 'text' }, field: 'empl_pk', show: true, width: '1%' },
    { title: 'Titre', sortable: 'empl_gender', id: 'empl_gender', align: 'right', show: true, width: '1%' },
    { title: 'Nom', sortable: 'empl_surname', filter: { empl_surname: 'text' }, id: 'empl_surname', shrinkable: true, show: true, width: '15%' },
    { title: 'Pr&eacute;nom', sortable: 'empl_firstname', filter: { empl_firstname: 'text' }, id: 'empl_firstname', shrinkable: true, show: true, width: '15%' },
    { title: 'Statut', sortable: 'empl_permanent', id: 'empl_permanent', align: 'center', show: true, width: '1%' },
    { title: 'Commentaire', sortable: 'trem_comment', id: 'trem_comment', field: 'trem_comment', show: true }, {
      id: 'empl_outcome',
      title: 'R&eacute;sultat',
      sortable: 'validated',
      filter: {
        validated: 'select'
      },
      data: [{ title: _.unescape('Valid&eacute;(e)'), id: true }, { title: _.unescape('Non valid&eacute;(e)'), id: false }],
      show: true,
      width: '1%',
      align: 'right'
    }
  ];

  $scope.$watch('trainees', function () {
    _.each($scope.trainees, function (trainee) {
      trainee.textClass = trainee.validated ? 'success' : 'danger'
    })
  }, true)

  Promise.all([dataSvc.getTraining($routeParams.trng_pk), dataSvc.getTrainingTypes(), dataSvc.getCertificates()]).then(_.spread(function (trng, trainingTypes, certificates) {
    $scope.trng = _.extend(trng, {
      type: trainingTypes[trng.trng_trty_fk],
      expirationDate: moment(trng.trng_date).add(trainingTypes[trng.trng_trty_fk].trty_validity, 'months').format('YYYY-MM-DD'),
      validity: moment.duration(trainingTypes[trng.trng_trty_fk].trty_validity, 'months').asYears()
    });

    $scope.tp = new NgTableParams(_({ sorting: { empl_surname: 'asc' }, count: 10 }).extend($location.search()).mapValues(function (val) {
      return _.isString(val) ? decodeURI(val) : val;
    }).value(), {
      filterDelay: 0,
      defaultSort: 'asc',
      dataset: $scope.trainees = _.map(trng.trainees, function (trainee) {
        return trainee.validated = trainee.trem_outcome === 'VALIDATED', trainee;
      })
    });

    $scope.certificates = _.values(certificates);
    busySvc.done('trainingCompletion');
  }), _.partial(busySvc.done, 'trainingCompletion'));

  $scope.unregister = function (empl) {
    $scope.$emit('alert', {
      type: 'primary',
      msg: '<b>' + (empl.empl_gender ? 'M.' : 'Mme') + ' ' + empl.empl_surname + ' ' + empl.empl_firstname +
        '</b> a &eacute;t&eacute; d&eacute;sinscrit(e) de la formation.',
      callback: function () {
        $scope.trainees.push(empl);
        $scope.tp.reload();
        return true; // close alert
      }
    });

    $scope.trainees.splice($scope.trainees.indexOf(empl), 1);
    $scope.tp.reload();
  };

  $scope.getDisplayDate = function () {
    if ($scope.trng.trng_start) {
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

  $scope.validateAll = function () {
    _.each($scope.trainees, _.partial(_.set, _, 'validated', true));
  };

  $scope.save = function () {
    ngDialog.openConfirm({
      template: 'components/dialogs/warning.html',
      scope: _.extend($scope.$new(true), {
        innerHtml: '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning"> ' + ($scope.trng.trng_outcome === 'SCHEDULED' ?
          '&eacute;diter le' : 'enregistrer les modifications apport&eacute;es au') + ' Proc&egrave;s&nbsp;Verbal</span> de cette formation&nbsp?'
      })
    }).then(function () {
      trainingsSvc.updateTraining($scope.trng.trng_pk, {
        trng_trty_fk: $scope.trng.type.trty_pk,
        trng_start: $scope.trng.trng_start,
        trng_date: $scope.trng.trng_date,
        trng_outcome: 'COMPLETED',
        trng_comment: $scope.trng.trng_comment && $scope.trng.trng_comment.length > 0 ? $scope.trng.trng_comment : null,
        trainers: _.map($scope.trng.trainers, 'empl_pk'),
        trainees: _.keyBy(_.each($scope.trainees, function (trainee) {
          trainee.trem_outcome = trainee.validated ? 'VALIDATED' : 'FLUNKED';
        }), 'empl_pk')
      }).then(function () {
        busySvc.done('ongoingOperation');
        $scope.$emit('alert', { type: 'success', msg: 'Proc&egrave;s verbal de fin de session &eacute;dit&eacute;.' });
        $location.path('/trainings/' + $scope.trng.trng_pk);
      });
    });
  };

  $scope.cancel = function () {
    ngDialog.openConfirm({
      template: 'components/dialogs/warning.html',
      scope: _.extend($scope.$new(true), {
        innerHtml: '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">annuler ' + ($scope.trng.trng_outcome ===
            'SCHEDULED' ? 'l\'&eacute;dition' : 'la modification') +
          ' du Proc&egrave;s&nbsp;Verbal</span> de cette formation&nbsp?<hr />En confirmant, toutes les modifications qui n\'ont pas &eacute;t&eacute; sauvegard&eacute;es seront perdues.'
      })
    }).then(function () {
      busySvc.done('ongoingOperation');
      $location.path('/trainings/' + $scope.trng.trng_pk);
    });
  };
};
