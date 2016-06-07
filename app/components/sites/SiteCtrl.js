'use strict';
/*jshint camelcase: false*/

var _ = require('underscore');
var moment = require('moment');
var pdfMake = require('pdfmake');
var imgs64 = require('../../img/imgs64.js');

module.exports = function ($scope, $routeParams, $location, $route, dataSvc, busySvc, ngDialog, updateSvc) {
  busySvc.busy();

  Promise.all([dataSvc.getSiteEmployeesWithStats($routeParams.site_pk), dataSvc.getSiteWithStats($routeParams.site_pk), dataSvc.getCertificates(), dataSvc.getLatestUpdate()]).then(
    function (results) {
      $scope.employees = _.values(results[0]);
      $scope.site = results[1];
      $scope.certificates = _.values(results[2]);
      $scope.update = results[3];
      busySvc.done();
      $scope.$apply();
    },
    function () {
      busySvc.done();
    });

  $scope.editNotes = function () {
    var dialogScope = $scope.$new(false);
    dialogScope.callback = function (notes, closeThisDialog) {
      updateSvc.createSite($scope.site.site_pk, $scope.site.site_name, $scope.site.site_dept_fk, notes).then(function () {
        closeThisDialog();
        $route.reload();
        $scope.$emit('alert', { type: 'success', msg: 'Informations mises &agrave; jour.' });
      });
    };

    ngDialog.open({
      scope: dialogScope,
      template: 'components/dialogs/edit_site_notes.html'
    });
  };

  $scope.openDashboardOptions = function () {
    ngDialog.open({
      template: './components/dialogs/dashboard_options.html',
      scope: $scope.$new(false),
      controller: ['$scope', 'ngDialog', function ($scope, ngDialog) {
        $scope.generateDashboardDocument = function () {
          ngDialog.closeAll();
          pdfMake.createPdf({
            info: {
              title: $scope.site.site_name,
              author: 'Generated by ' + $location.host()
            },
            pageSize: $scope.format,
            pageOrientation: $scope.orientation,
            pageMargins: [40, 90, 40, 60],
            content: [{
              columns: [{
                width: '*',
                text: ''
              }, {
                width: 'auto',
                table: {
                  headerRows: 1,
                  body: [
                    [{
                      text: 'Aptitude',
                      colSpan: 2,
                      alignment: 'center',
                      style: 'table-header'
                    }, {}, {
                      text: 'Agents formés',
                      style: 'table-header'
                    }, {
                      text: 'Cible',
                      alignment: 'right',
                      style: 'table-header'
                    }]
                  ].concat(_.where($scope.certificates, {
                    checked: true
                  }).map(function (cert) {
                    var certStats = $scope.site.stats.certificates[cert.cert_pk];
                    return [{
                      text: cert.cert_short,
                      style: certStats.targetStatus,
                      alignment: 'right'
                    }, {
                      text: cert.cert_name,
                      style: certStats.targetStatus
                    }, {
                      text: certStats.count + ' (' + certStats.countPercentage + '%)',
                      style: certStats.targetStatus,
                      alignment: 'center'
                    }, {
                      text: certStats.target + ' (' + cert.cert_target + '%)',
                      alignment: 'right'
                    }];
                  }))
                },
                margin: [0, 0, 0, 30],
                layout: {
                  hLineWidth: function (i, node) {
                    if (i === 0 || i === node.table.body.length) {
                      return 0;
                    }

                    return 1;
                  },
                  vLineWidth: function () {
                    return 0;
                  },
                  hLineColor: function (i) {
                    return (i === 1) ? 'black' : 'grey';
                  },
                  vLineColor: function () {
                    return 'grey';
                  }
                }
              }, {
                width: '*',
                text: ''
              }]
            }, {
              columns: [{
                width: '*',
                text: ''
              }].concat(_.flatten(_.where($scope.certificates, {
                checked: true
              }).map(function (cert) {
                var employees = _.sortBy(_.filter($scope.employees, function (empl) {
                  return empl.stats.certificates[cert.cert_pk] && empl.stats.certificates[cert.cert_pk].valid;
                }), 'empl_surname');
                return [{
                  width: 'auto',
                  table: {
                    headerRows: 2,
                    body: [
                      [{
                        text: cert.cert_name,
                        colSpan: 3,
                        alignment: 'center',
                        style: 'table-header'
                      }, {}, {}],
                      [{
                        text: 'Nom',
                        style: 'table-header'
                      }, {
                        text: 'Prénom',
                        style: 'table-header'
                      }, {
                        text: cert.cert_short + ' à renouveler en',
                        alignment: 'center',
                        style: 'table-header'
                      }]
                    ].concat(employees.map(function (empl) {
                      return [{
                        text: empl.empl_surname,
                        style: 'em'
                      }, {
                        text: empl.empl_firstname,
                        style: 'em'
                      }, {
                        text: moment(empl.stats.certificates[cert.cert_pk].expiryDate).format('MMM YYYY'),
                        alignment: 'right'
                      }];
                    }))
                  },
                  layout: {
                    hLineWidth: function () {
                      return 1;
                    },
                    vLineWidth: function (i, node) {
                      if (i === 0 || i === node.table.widths.length) {
                        return 1;
                      }

                      return 0;
                    },
                    hLineColor: function (i) {
                      return (i === 2) ? 'black' : 'grey';
                    },
                    vLineColor: function () {
                      return 'grey';
                    }
                  }
                }, {
                  width: '*',
                  text: ''
                }];
              }), true))
            }],
            header: function () {
              return {
                table: {
                  widths: ['*', '*', '*'],
                  body: [
                    [{
                      text: $scope.site.site_name,
                      style: 'title'
                    }, {
                      image: imgs64.logo,
                      alignment: 'center',
                      width: 150,
                      margin: [0, -10, 0, 0]
                    }, {
                      text: [{
                        text: moment(new Date()).format('dddd Do MMMM YYYY'),
                        style: 'em'
                      }, {
                        text: '\nTableau de bord'
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
                    'Fiche site : ', {
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
                margin: [20, 20, 20, 0]
              };
            },
            styles: {
              'title': {
                fontSize: 16,
                color: 'black'
              },
              'em': {
                color: 'black'
              },
              'table-header': {
                bold: true,
                fontSize: 13
              },
              'link': {
                decoration: 'underline',
                color: 'black'
              },
              'danger': {
                color: '#e51c23'
              },
              'warning': {
                color: '#ff9800'
              },
              'success': {
                color: 'green'
              }
            },
            defaultStyle: {
              color: 'grey'
            }
          }).open();
        };
      }]
    });
  };

  $scope.selectEmployee = function (empl_pk) {
    $location.path('/employees/' + empl_pk);
  };

  $scope.select = function (site_pk) {
    $location.path('/sites/' + site_pk);
  };
};
