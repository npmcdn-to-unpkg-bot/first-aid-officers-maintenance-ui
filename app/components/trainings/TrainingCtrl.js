'use strict';
/*jshint camelcase: false*/

var _ = require('underscore');
var moment = require('moment');
var pdfMake = require('pdfmake');
var imgs64 = require('../../img/imgs64.js');

module.exports = function ($scope, $rootScope, $routeParams, dataSvc, trngSvc, $location, ngDialog, busySvc, dateFilter) {
  busySvc.busy();

  Promise.all([dataSvc.getTraining($routeParams.trng_pk), dataSvc.getTrainingTypes(), dataSvc.getCertificates()]).then(function (results) {
    $scope.trng = results[0];
    $scope.trng.type = results[1][results[0].trng_trty_fk];
    $scope.trainees = _.values(results[0].trainees);
    $scope.certificates = _.values(results[2]);
    $scope.trng.expirationDate = moment($scope.trng.trng_date).add($scope.trng.type.trty_validity, 'months').format('YYYY-MM-DD');
    $scope.trng.validity = moment.duration($scope.trng.type.trty_validity, 'months').asYears();
    busySvc.done();
    $scope.$apply();
  }, function () {
    busySvc.done();
  });

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

  $scope.generateSignInSheet = function () {
    pdfMake.createPdf({
      info: {
        title: $scope.trng.type.trty_name + ' - ' + moment($scope.trng.trng_date).format('dddd Do MMMM YYYY'),
        author: 'Generated by ' + $location.host()
      },
      header: function () {
        return {
          table: {
            widths: ['*', '*', '*'],
            body: [
              [{
                text: $scope.trng.type.trty_name,
                style: 'title'
              }, {
                image: imgs64.logo,
                alignment: 'center',
                width: 150,
                margin: [0, -10, 0, 0]
              }, {
                text: [{
                  text: $scope.getDisplayDate(),
                  style: 'em'
                }, {
                  text: '\nFiche d\'émargement'
                }],
                alignment: 'right'
              }]
            ]
          },
          layout: 'noBorders',
          margin: [30, 20]
        };
      },
      footer: function (currentPage, pageCount) {
        return {
          columns: [{
            width: '*',
            text: [
              'Fiche formation : ', {
                text: $location.absUrl(),
                link: $location.absUrl(),
                style: 'link'
              }
            ]
          }, {
            width: 'auto',
            text: [
              'page ', {
                text: currentPage.toString(),
                style: 'em'
              },
              ' sur ', {
                text: pageCount.toString(),
                style: 'em'
              }
            ],
            alignment: 'right'
          }],
          margin: [30, 20]
        };
      },
      content: [{
        layout: 'noBorders',
        table: {
          widths: ['*', '*'],
          body: [
            [{
              text: [
                'Formateur(s) :\n'
              ].concat(
                _.map($scope.trng.trainers, function (trainer) {
                  return {
                    text: trainer.empl_surname + ' ' + trainer.empl_firstname + '\n',
                    style: 'em'
                  };
                }))
            }, {
              table: {
                widths: ['*'],
                body: [
                  [{ text: 'Signature du/des formateur(s)', alignment: 'center', margin: [0, 0, 0, 50] }]
                ]
              }
            }],
            [{ text: 'Lieu de formation :', colSpan: 2, margin: [0, 0, 0, 20] }, {}],
            [{
              text: [{ text: 'Notes :\n' }, {
                text: $scope.trng.trng_comment || '\n',
                style: 'em'
              }],
              colSpan: 2,
              margin: [0, 0, 0, 20]
            }, {}]
          ]
        },
      }, {
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', 'auto', 'auto', '*'],
          body: [
            [{
              text: 'Matricule',
              style: 'table-header'
            }, {
              text: 'Titre',
              style: 'table-header'
            }, {
              text: 'Nom',
              style: 'table-header'
            }, {
              text: 'Prénom',
              style: 'table-header'
            }, {
              text: 'Émargement',
              style: 'table-header',
              alignment: 'center'
            }]
          ].concat(_.map(_.sortBy($scope.trainees, 'empl_surname'), function (empl) {
            return [empl.empl_pk, {
              text: empl.empl_gender ? 'M.' : 'Mme',
              style: 'em',
              alignment: 'right'
            }, {
              text: empl.empl_surname,
              style: 'em'
            }, {
              text: empl.empl_firstname,
              style: 'em'
            }, ''];
          }))
        },
        layout: {
          hLineWidth: function (i, node) {
            if (i === 0 || i === node.table.body.length) {
              return 0;
            }

            return (i === 1) ? 2 : 1;
          },
          vLineWidth: function () {
            return 0;
          },
          hLineColor: function (i) {
            return (i === 1) ? 'black' : 'grey';
          },
          vLineColor: function () {
            return 'grey';
          },
          paddingTop: function (i) {
            return i === 0 ? 4 : 10;
          },
          paddingBottom: function (i) {
            return i === 0 ? 4 : 10;
          },
          paddingLeft: function (i) {
            return i === 0 ? 0 : 6;
          },
          paddingRight: function (i, node) {
            return i === node.table.widths.length - 1 ? 0 : 6;
          }
        }
      }],
      pageMargins: [40, 85, 40, 60],
      styles: {
        'em': {
          color: 'black'
        },
        'link': {
          decoration: 'underline',
          color: 'black'
        },
        'title': {
          fontSize: 16,
          color: 'black'
        },
        'table-header': {
          bold: true,
          fontSize: 13
        }
      },
      defaultStyle: {
        color: 'grey'
      }
    }).open();
  };

  $scope.selectEmployee = function (empl_pk) {
    $location.path('/employees/' + empl_pk);
  };

  $scope.edit = function () {
    $location.path('/trainings/' + $scope.trng.trng_pk + '/edit');
  };

  $scope.complete = function () {
    $location.path('/trainings/' + $scope.trng.trng_pk + '/complete');
  };

  $scope.delete = function () {
    var dialogScope = $scope.$new(true);
    dialogScope.innerHtml = '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">supprimer d&eacute;finitivement</span> cette formation&nbsp? Cette op&eacute;ration est irr&eacute;versible et prend effet imm&eacute;diatement.';
    ngDialog.openConfirm({
      template: 'components/dialogs/warning.html',
      scope: dialogScope
    }).then(function () {
      trngSvc.deleteTraining($scope.trng.trng_pk).then(function () {
        $rootScope.alerts.push({
          type: 'success',
          msg: 'Formation effac&eacute;e.'
        });

        $location.path('/trainings');
      });
    });
  };
};
