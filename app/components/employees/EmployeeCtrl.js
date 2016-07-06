'use strict';
/*jshint camelcase: false*/

var _ = require('lodash');
var moment = require('moment');

module.exports = function ($rootScope, $scope, $routeParams, dataSvc, $location, ngDialog, $route, busySvc, EmployeesNotesSvc, NgTableParams) {
  busySvc.busy('employee');

  $scope.cols = [
    { id: 'button', clazz: 'primary', on: 'hover', width: '1%', show: true },
    { title: 'Type de formation', id: 'type', sortable: 'type.trty_order', filter: { 'type.trty_name': 'select' }, field: 'type.trty_name', colspan: 2, width: '20%', show: true },
    { id: 'certs', align: 'right', hideHeader: true, width: '1%', show: true },
    { title: 'Date(s)', id: 'dates', sortable: 'trng_date', field: 'trng_displayDate', width: '20%', show: true },
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

  Promise.all([dataSvc.getEmployee($routeParams.empl_pk), dataSvc.getTrainingTypes(), dataSvc.getCertificates(),
      dataSvc.getEmployeeSite($routeParams.empl_pk), dataSvc.getEmployeeCertificatesVoiding($routeParams.empl_pk)
    ].concat($scope.hasRole('access4') ? [dataSvc.getEmployeeTrainings($routeParams.empl_pk)] : []))
    .then(_.spread(function (employee, trainingTypes, certificates, site, certificatesVoiding, trainings) {
      $scope.empl = employee;
      $scope.site = site;
      $scope.certificates = _.values(certificates);
      $scope.certificatesVoiding = _.each(certificatesVoiding, function (voiding) {
        voiding.cert = certificates[voiding.emce_cert_fk];
        voiding.date = new Date(voiding.emce_date);
      });

      _.find($scope.cols, { id: 'type' }).data = _.map(_.orderBy(trainingTypes, 'trty_order'), function (type) {
        return { title: type.trty_name, id: type.trty_name };
      });

      $scope.tp = new NgTableParams(_({ sorting: { trng_date: 'desc' }, count: 10 }).extend($location.search()).mapValues(function (val) {
        return _.isString(val) ? decodeURI(val) : val;
      }).value(), {
        filterDelay: 0,
        defaultSort: 'asc',
        dataset: $scope.trainings = _.map(trainings || [], function (trng) {
          return trng.type = trainingTypes[trng.trng_trty_fk], trng;
        })
      });

      $scope.$apply(); // force $location to sync with the browser
      $scope.$watch(function () {
        return JSON.stringify(_.mapKeys($scope.tp.url(), _.flow(_.nthArg(1), decodeURI)));
      }, function () {
        $location.search(_.mapValues(_.mapKeys($scope.tp.url(), _.flow(_.nthArg(1), decodeURI)), decodeURIComponent)).replace();
        setTimeout(function () {
          $scope.$apply(); // force $location to sync with the browser
        }, 0);
      });

      busySvc.done('employee');
    }), _.partial(busySvc.done, 'employee'));

  $scope.editNotes = function () {
    ngDialog.open({
      scope: _.extend($scope.$new(false), {
        notes: $scope.empl.empl_notes,
        _title: $scope.empl_gender ? 'M.' : 'Mme' + ' ' + $scope.empl.empl_surname + ' ' + $scope.empl.empl_firstname,
        callback: function (notes, closeThisDialog) {
          EmployeesNotesSvc.setNotes($scope.empl.empl_pk, notes).then(function () {
            closeThisDialog();
            $route.reload();
            $scope.$emit('alert', { type: 'success', msg: 'Notes mises &agrave; jour.' });
          });
        }
      }),
      template: 'components/dialogs/edit_notes.html'
    });
  };

  $scope.addVoiding = function () {
    ngDialog.open({
      template: 'components/dialogs/employee_voiding.html',
      scope: _.extend($scope.$new(), {
        notes: $scope.empl.empl_notes,
        availableVoidings: _.differenceBy($scope.certificates, $scope.certificatesVoiding, function (cert) {
          return cert.cert_pk || cert.emce_cert_fk;
        }),
        currentVoidings: _.intersectionBy($scope.certificates, $scope.certificatesVoiding, function (cert) {
          return cert.cert_pk || cert.emce_cert_fk;
        }),
        isValid: function (optout, cert, date, reason) {
          if (optout) {
            return Object.prototype.toString.call(date) === '[object Date]' && !isNaN(date.getTime()) && cert && reason && reason.length;
          }

          return cert;
        },
        callback: function (optout, cert, date, reason) {
          var empl_display = ($scope.empl.empl_gender ? 'M.' : 'Mme') + ' ' + $scope.empl.empl_surname + ' ' + $scope.empl.empl_firstname;
          var innerHtml = optout ?
            'Exclure un agent d\'un certain dispositif rend son aptitude correspondante <span class="text-warning">invalide</span> &agrave; compter de la date de sortie.<hr />' :
            '';
          innerHtml += '&Ecirc;tes-vous s&ucirc;r(e) de vouloir ' + '<span class="text-warning">' + (optout ? 'sortir ' + empl_display + '</span><br /> du ' :
            'r&eacute;int&eacute;grer ' + empl_display + '</span><br /> dans le') + ' <span class="text-warning">dispositif ' + cert.cert_short + '</span>' + (
            optout ? ' &agrave; compter du ' + moment(date).format('Do MMMM YYYY') : '') + ' ?';
          ngDialog.openConfirm({
            template: 'components/dialogs/warning.html',
            scope: _.extend($scope.$new(), { innerHtml: innerHtml })
          }).then(function () {
            ngDialog.closeAll();
            if (optout) {
              EmployeesNotesSvc.optOut($scope.empl.empl_pk, cert.cert_pk, date, reason)
                .then(function () {
                  $route.reload();
                  $scope.$emit('alert', { type: 'success', msg: empl_display + ' a &eacute;t&eacute; sorti(e) du dispositif ' + cert.cert_short + '.' });
                });
            } else {
              EmployeesNotesSvc.optIn($scope.empl.empl_pk, cert.cert_pk)
                .then(function () {
                  $route.reload();
                  $scope.$emit('alert', { type: 'success', msg: empl_display + ' a r&eacute;int&eacute;gr&eacute; le dispositif ' + cert.cert_short + '.' });
                });
            }
          });
        }
      })
    });
  };

  $scope.selectTraining = function (trng_pk) {
    $location.path('/trainings/' + trng_pk).search({});
  };
};
