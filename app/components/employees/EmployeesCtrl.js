'use strict';
/*jshint camelcase: false*/

var _ = require('lodash');
var moment = require('moment');
var helper = require('./employeesConditionsHelper.js');
var reports = require('./employeesReports.js');

module.exports = function ($scope, $location, dataSvc, busySvc, NgTableParams, ngDialog) {
  var colsBase = [
    { id: 'button', clazz: 'primary', on: '(hover && !siteHover)', show: true },
    { title: 'Matricule', sortable: 'empl_pk', filter: { empl_pk: 'text' }, field: 'empl_pk', show: true, width: '10%' },
    { title: 'Titre', sortable: 'empl_gender', id: 'empl_gender', align: 'right', show: true },
    { title: 'Nom', sortable: 'empl_surname', filter: { empl_surname: 'text' }, id: 'empl_surname', shrinkable: true, show: true, width: '20%' },
    { title: 'Pr&eacute;nom', sortable: 'empl_firstname', filter: { empl_firstname: 'text' }, id: 'empl_firstname', shrinkable: true, show: true, width: '20%' },
    { id: 'button', clazz: 'primary', on: 'siteHover', siteHover: true, show: true }, {
      title: 'Affectation',
      sortable: 'site.site_name',
      filter: { 'site.site_name': 'autocomplete' },
      id: 'site.site_name',
      shrinkable: true,
      siteHover: true,
      show: true,
      width: '40%'
    },
    { title: 'Statut', sortable: 'empl_permanent', id: 'empl_permanent', align: 'center', show: true }
  ];

  $scope.conditions = [];
  $scope.addCondition = function (cert) {
    ngDialog.open({
      template: './components/dialogs/employees_params_certificate.html',
      scope: _.extend($scope.$new(), {
        cert: cert,
        recentOptions: helper.recentOptions,
        statusOptions: helper.statusOptions,
        certificatesConditions: helper.certificatesConditions,
      }),
      preCloseCallback: function () {
        delete $scope.cert;
      },
      controller: ['$scope', function (scope) {
        scope.params = {};
        scope.isValid = _.partial(helper.isValid, scope.params);

        scope.add = function () {
          $scope.conditions.push({
            display: helper.getConditionDisplay(scope.cert, scope.params),
            params: scope.params,
            cert: cert.cert_pk
          });
          scope.closeThisDialog();
        };
      }]
    });
  };

  $scope.$watch('certificates', function (certificates) {
    _.each(certificates, function (cert) {
      _.find($scope.cols, { id: 'cert', cert_pk: cert.cert_pk }).show = cert.checked || false;
    });
  }, true);

  $scope.getFilterDisplay = function (key, value) {
    var col = _.find($scope.cols, function (col) {
      return _.find(col, key);
    });

    return _.extend({ title: col.title },
      (function () {
        switch (key) {
          case 'site.site_name':
            var site = _.find($scope.sites, { site_name: value });
            return { link: site ? 'est' : 'contient', value: value };
          default:
            return { value: value };
        }
      }()));
  };

  function updateSearch() {
    $location.search(_.extend(_.mapKeys($scope.tp.url(), _.flow(_.nthArg(1), decodeURI)), { conditions: helper.toURIComponent(helper.stripDown($scope.conditions)) })).replace();
  }

  busySvc.busy('employees');
  Promise.all([dataSvc.getCertificates(), dataSvc.getSites(), dataSvc.getEmployeesWithStats()]).then(_.spread(function (certificates, sites, employees) {
    $scope.certificates = _.values(certificates);
    $scope.sites = sites;
    $scope.employees = _.values(_.each(employees, function (empl) {
      empl.site = $scope.sites[empl.siem_site_fk];
    }));

    $scope.cols = colsBase.concat($scope.certificates.map(function (cert) {
      return { title: cert.cert_short, sortable: 'stats.certificates[' + cert.cert_pk + '].expiryDate', id: 'cert', cert_pk: cert.cert_pk, show: true, align: 'center' };
    }));
    _.find($scope.cols, { id: 'site.site_name' }).data = _.map(sites, 'site_name');

    // Restore status from URL search parameters and initiliaze table parameters
    $scope.conditions = helper.fillUp(helper.fromURIComponent($location.search().conditions), certificates);
    $scope.tp = new NgTableParams(_.mapValues(_.omit(_.extend({ sorting: { empl_surname: 'asc' }, count: 10 }, $location.search()), 'conditions'), function (val) {
      return _.isString(val) ? decodeURI(val) : val;
    }), {
      filterDelay: 0,
      defaultSort: 'asc'
    });

    // Manually filter employees according to defined conditions
    $scope.$watchCollection('conditions', function () {
      $scope.tp.settings({
        dataset: _.filter($scope.employees, function (empl) {
          return _.every($scope.conditions, function (condition) {
            return helper.testCondition(empl.stats.certificates[condition.cert], condition.params);
          });
        })
      });
    });

    // Update url search parameters
    $scope.$watchCollection('conditions', updateSearch);
    $scope.$watch(function () {
      return JSON.stringify(_.mapKeys($scope.tp.url(), _.flow(_.nthArg(1), decodeURI)));
    }, updateSearch);

    busySvc.done('employees');
    // avoid bypassing the uib-collapse animation
    setTimeout(function () {
      $scope.advancedSearch = $scope.conditions.length > 0;
      $scope.$digest();
    }, 0);
  }), _.partial(busySvc.done, 'employees'));

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
          setTimeout(function () {
            var report;
            if (params.pdf) {
              report = reports.generatePDF(params, {
                  title: 'Extraction des Agents - ' + moment().format('DD/MM/YYYY'),
                  author: 'Generated by ' + $location.host()
                }, $scope.conditions, _.map(
                  _.omitBy($scope.tp.filter(), _.overSome(_.isNil, _.partial(_.isEqual, _, ''))),
                  _.rearg($scope.getFilterDisplay, [1, 0])),
                $scope.cols, _.take(data, 1000));
            } else {
              report = reports.generateXLSX(_.reject(_.filter($scope.cols, params.columns === 'all' ? _.stubTrue : 'show'), { id: 'button' }), data);
            }

            report.download(moment().format('YYYY-MM-DD') + ' - Extraction des Agents' + (params.pdf ? '.pdf' : '.xlsx'));
            busySvc.done('report');
            close();
          }, 0);
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

  $scope.select = function (empl_pk) {
    $location.path('/employees/' + empl_pk).search({});
  };

  $scope.selectSite = function (site_pk) {
    $location.path('/sites/' + site_pk).search({});
  };
};
