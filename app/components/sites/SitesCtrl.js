'use strict';
/*jshint camelcase: false*/

var _ = require('lodash');
var moment = require('moment');
var helper = require('./sitesConditionsHelper.js');
var sitesReports = require('./sitesReports');

module.exports = function ($scope, $location, $cookies, dataSvc, busySvc, NgTableParams, ngDialog) {
  var colsBase = [
    { id: 'button', clazz: 'primary', on: 'hover', width: '1%', show: true },
    { title: 'Nom', sortable: 'site_name', filter: { 'site_name': 'text' }, id: 'site_name', show: true },
    { title: 'D&eacute;partement', sortable: 'dept.dept_name', filter: { 'dept.dept_id': 'select' }, field: 'dept.dept_name', show: true }
  ];

  $scope.conditions = [];
  $scope.addCondition = function (cert) {
    ngDialog.open({
      template: './components/dialogs/sites_params_certificate.html',
      scope: _.extend($scope.$new(), {
        cert: cert,
        comparisonOptions: helper.comparisonOptions,
        targetOptions: helper.targetOptions,
        certificatesConditions: helper.certificatesConditions
      }),
      preCloseCallback: function () {
        delete $scope.cert;
      },
      controller: ['$scope', function (scope) {
        scope.params = {};
        scope.add = function () {
          $scope.conditions.push({
            display: helper.getConditionDisplay(scope.cert, scope.params),
            params: scope.params,
            cert: cert
          });
          scope.closeThisDialog();
        };
      }]
    });
  };

  $scope.getFilterDisplay = function (key, value) {
    var col = _.find($scope.cols, function (col) {
      return _.find(col, key);
    });

    return _.extend({ title: col.title },
      (function () {
        switch (key) {
          case 'dept.dept_id':
            return { link: 'est', value: _.find(col.data, { id: value }).title };
          default:
            return { value: value };
        }
      }()));
  };

  function updateSearch() {
    $location.search(_.extend(_.mapKeys($scope.tp.url(), _.flow(_.nthArg(1), decodeURI)), { conditions: helper.toURIComponent(helper.stripDown($scope.conditions)) }))
      .search('details', helper.toURIComponent($scope.details)).replace();
  }

  $scope.check = function (cert) {
    if (cert.checked) {
      $scope.details[cert.cert_pk] = _.extend($scope.details[cert.cert_pk], { cert: true });
    } else {
      $scope.details[cert.cert_pk] = _.mapValues($scope.details[cert.cert_pk] || {}, _.constant(false));
    }
  };

  busySvc.busy('sites');
  Promise.all([dataSvc.getCertificates(), dataSvc.getDepartments(), dataSvc.getSitesWithStats()]).then(_.spread(function (certificates, departments, sites) {
    _.find(colsBase, { field: 'dept.dept_name' }).data = _.sortBy(_.map(departments, function (dept) {
      return { title: dept.dept_name, id: dept.dept_id };
    }), function (dept) {
      return dept.id === 'NONE' ? 0 : dept.title;
    });

    $scope.cols = _.flatten(colsBase.concat(_.map(certificates, function (cert) {
      return _.each([
        { title: cert.cert_short + '&nbsp;(%)', sortable: 'stats.certificates[' + cert.cert_pk + '].countPercentage', id: 'cert' },
        { title: cert.cert_short, sortable: 'stats.certificates[' + cert.cert_pk + '].count', field: 'stats.certificates[' + cert.cert_pk + '].count', id: 'count' },
        { title: 'Cible&nbsp;' + cert.cert_short, sortable: 'stats.certificates[' + cert.cert_pk + '].target', id: 'target' },
        { title: cert.cert_short + '&nbsp;&agrave;&nbsp;former', sortable: 'stats.certificates[' + cert.cert_pk + '].remaining', id: 'remaining' }
      ], _.partial(_.extend, _, { cert_pk: cert.cert_pk, width: '1%', show: false, align: 'center' }));
    })));

    $scope.departments = departments;
    $scope.sites = _.values(_.each(sites, function (site) {
      _.each(site.stats.certificates, function (certStats) {
        certStats.remaining = certStats.target > certStats.count ? certStats.target - certStats.count : 0;
      });
      site.dept = $scope.departments[site.site_dept_fk];
    }));

    // Restore checked certificates from cookies when present and automatically checks (partially?) shown certificates
    $scope.details = helper.fromURIComponent($location.search().details);
    $cookies.putObject('stateSustain-' + 'certificates_checked', $scope.certificates = _.map(certificates, function (cert) {
      var cookiesCheck = (_.find($cookies.getObject('stateSustain-' + 'certificates_checked') || {}, { cert_short: cert.cert_short }) || {}).checked;
      var urlCheck = _.some($scope.details[cert.cert_pk]);
      if (!urlCheck) {
        $scope.details[cert.cert_pk] = _.extend($scope.details[cert.cert_pk], { cert: cookiesCheck || false });
      }

      return cert.checked = cookiesCheck || urlCheck, cert;
    }));

    // Restore status from URL search parameters and initiliaze table parameters
    $scope.conditions = helper.fillUp(helper.fromURIComponent($location.search().conditions), certificates);
    $scope.tp = new NgTableParams(_.mapValues(_.omit(_.extend({ sorting: { site_name: 'asc' }, count: 10 }, $location.search()), ['conditions', 'details']), function (val) {
      return _.isString(val) ? decodeURI(val) : val;
    }), {
      filterDelay: 0,
      defaultSort: 'asc'
    });

    // Show/hide specific columns
    $scope.$watch('details', function (details) {
      _.each(details, function (certDetails, cert_pk) {
        _.each(certDetails, function (shown, type) {
          _.find($scope.cols, { id: type, cert_pk: parseInt(cert_pk) }).show = shown;
        });
      });
    }, true);

    // Manually filter employees according to defined conditions
    $scope.$watchCollection('conditions', function () {
      $scope.tp.settings({
        dataset: _.filter($scope.sites, function (site) {
          return _.every($scope.conditions, function (condition) {
            return helper.testCondition(site.stats.certificates[condition.cert.cert_pk], condition.params);
          });
        })
      });
    });

    // Update url search parameters
    $scope.$watch('details', updateSearch, true);
    $scope.$watchCollection('conditions', updateSearch);
    $scope.$watch(function () {
      return JSON.stringify(_.mapKeys($scope.tp.url(), _.flow(_.nthArg(1), decodeURI)));
    }, updateSearch);

    busySvc.done('sites');
    // avoid bypassing the uib-collapse animation
    setTimeout(function () {
      $scope.advancedSearch = $scope.conditions.length > 0;
      $scope.$digest();
    }, 0);
  }), _.partial(busySvc.done, 'sites'));

  $scope.export = function () {
    ngDialog.open({
      template: './components/dialogs/export_options.html',
      scope: _.extend($scope.$new(), {
        callback: function (params, close) {
          busySvc.busy('report', true);
          setTimeout(function () {
            var report;
            var data = $scope.tp.settings().getData(new NgTableParams($scope.tp.parameters(), {
              dataOptions: { applyPaging: false },
              dataset: $scope.tp.settings().dataset
            }));

            if (params.pdf) {
              report = sitesReports.generatePDF(params, {
                  title: 'Extraction des Sites - ' + moment().format('DD/MM/YYYY'),
                  author: 'Generated by ' + $location.host()
                }, $scope.conditions, _.map(_.omitBy($scope.tp.filter(), _.overSome(_.isNil, _.partial(_.isEqual, _, ''))), _.rearg($scope.getFilterDisplay, [1,
                  0
                ])),
                $scope.cols, data);
            } else {
              report = sitesReports.generateXLSX(_.reject(_.filter($scope.cols, params.columns === 'all' ? _.constant(true) : 'show'), { id: 'button' }), data);
            }

            report.download(moment().format('YYYY-MM-DD') + ' - Extraction des Sites' + (params.pdf ? '.pdf' : '.xlsx'));
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

  $scope.select = function (site_pk) {
    $location.path('/sites/' + site_pk).search({});
  };
};
