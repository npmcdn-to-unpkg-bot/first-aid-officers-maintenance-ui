'use strict';
/*jshint camelcase: false*/

var _ = require('lodash');
var moment = require('moment');
var helper = require('../search/employees/employeesSearchHelper.js');

module.exports = function ($scope, $location, dataSvc, busySvc, NgTableParams, ngDialog) {
  $scope.colsBase = [{
    id: 'button',
    clazz: 'primary',
    on: '(hover && !siteHover)',
    show: true
  }, {
    title: 'Matricule',
    sortable: 'empl_pk',
    filter: {
      empl_pk: 'text'
    },
    field: 'empl_pk',
    show: true,
    width: '10%'
  }, {
    title: 'Titre',
    sortable: 'empl_gender',
    id: 'empl_gender',
    align: 'right',
    show: true
  }, {
    title: 'Nom',
    sortable: 'empl_surname',
    filter: {
      empl_surname: 'text'
    },
    id: 'empl_surname',
    shrinkable: true,
    show: true,
    width: '20%'
  }, {
    title: 'Pr&eacute;nom',
    sortable: 'empl_firstname',
    filter: {
      empl_firstname: 'text'
    },
    id: 'empl_firstname',
    shrinkable: true,
    show: true,
    width: '20%'
  }, {
    id: 'button',
    clazz: 'primary',
    on: 'siteHover',
    siteHover: true,
    show: true
  }, {
    title: 'Affectation',
    sortable: 'site.site_name',
    filter: {
      'site.site_name': 'text'
    },
    id: 'site.site_name',
    shrinkable: true,
    siteHover: true,
    show: true,
    width: '40%'
  }, {
    title: 'Statut',
    sortable: 'empl_permanent',
    id: 'empl_permanent',
    align: 'center',
    show: true
  }];

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
        scope.isValid = function () {
          var res = true;
          if (!scope.params.condition) {
            return false;
          }

          if (scope.params.condition.value !== 'expiring' && scope.params.condition.value !== 'expiry') {
            res = scope.params.option !== undefined;
          }

          if (scope.params.condition.value !== 'status') {
            res = res && scope.params.data !== undefined && scope.params.data !== null;
          }

          if (scope.params.condition.value === 'expiry') {
            res = res && scope.params.data && scope.params.data.from;
            res = res && scope.params.data.to && !isNaN(scope.params.data.from.getTime()) && !isNaN(scope.params.data.to.getTime());
          }

          return res;
        };

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

  $scope.colFor = function (filter) {
    return _.find($scope.cols, function (col) {
      return _.find(col, filter);
    });
  };

  $scope.$watchCollection('employees', function () {
    if ($scope.tp) {
      $scope.tp.settings({
        dataset: $scope.employees
      });
    }
  });

  function testCondition(certStats, params) {
    switch (params.condition.value) {
      case 'recent':
        if (!certStats) {
          return false;
        }

        var xMonthsAgo = moment(new Date()).subtract(params.data, 'months');
        if (params.option.value === 'danger') {
          return moment(certStats.expiryDate).isBetween(xMonthsAgo, new Date());
        }

        return _.some(certStats.trainings, function (trng) {
          return trng.trem_outcome === 'VALIDATED' && moment(trng.trng_date).isBetween(xMonthsAgo, new Date());
        });
      case 'expiring':
        if (!certStats) {
          return false;
        }

        var inXMonths = moment(new Date()).add(params.data, 'months');
        return moment(certStats.expiryDate).isBetween(new Date(), inXMonths);
      case 'expiry':
        if (!certStats) {
          return false;
        }

        return moment(certStats.expiryDate).isBetween(params.data.from, params.data.to, null, '[]');
      case 'status':
        if (!certStats) {
          return params.option.value === 'blank';
        }

        return params.option.value === certStats.validityStatus;
    }
  }

  function filterEmpl(empl) {
    return _.every($scope.conditions, function (condition) {
      return testCondition(empl.stats.certificates[condition.cert], condition.params);
    });
  }

  busySvc.busy('employees');
  Promise.all([dataSvc.getCertificates(), dataSvc.getSites(), dataSvc.getEmployeesWithStats()]).then(_.spread(function (certificates, sites, employees) {
    $scope.certificates = $scope.certificates = _.values(certificates);
    $scope.sites = sites;
    $scope.employeesSource = _.values(_.each(employees, function (empl) {
      empl.site = $scope.sites[empl.siem_site_fk];
    }));

    $scope.cols = $scope.colsBase.concat($scope.certificates.map(function (cert) {
      return {
        title: cert.cert_short,
        sortable: 'stats.certificates[' + cert.cert_pk + '].expiryDate',
        id: 'cert',
        cert_pk: cert.cert_pk,
        show: true,
        align: 'center'
      };
    }));

    $scope.tp = new NgTableParams(_.omit(_.extend({ sorting: { empl_surname: 'asc' }, count: 10 }, $location.search()), 'conditions'), {
      filterDelay: 0,
      dataset: $scope.employees
    });

    $scope.filtering = function () {
      return _.some($scope.tp.filter(), _.identity);
    };

    function updateSearch() {
      $location.search(_.extend(_.mapKeys($scope.tp.url(), _.flow(_.nthArg(1), decodeURI)), { conditions: helper.arrayToURIComponent(helper.stripDownConditions($scope.conditions)) }))
        .replace();
    }

    function updateEmployees() {
      $scope.employees = _.filter($scope.employeesSource, filterEmpl);
    }

    $scope.conditions = helper.fillUpConditions(helper.arrayFromURIComponent($location.search().conditions), certificates);
    console.log($scope.conditions)

    $scope.$watch('conditions', updateEmployees, true);
    $scope.$watch('conditions', updateSearch, true);
    $scope.advancedSearch = false;

    $scope.$watch(function () {
      return JSON.stringify(_.mapKeys($scope.tp.url(), _.flow(_.nthArg(1), decodeURI)));
    }, updateSearch);

    console.log($scope.tp)

    busySvc.done('employees');
    setTimeout(function () {
      // avoid bypassing the uib-collapse animation
      $scope.advancedSearch = $scope.conditions.length > 0;
      $scope.$digest();
    }, 0)
  }), _.partial(busySvc.done, 'employees'));

  $scope.select = function (empl_pk) {
    $location.path('/employees/' + empl_pk).search({});
  };

  $scope.selectSite = function (site_pk) {
    $location.path('/sites/' + site_pk).search({});
  };
};
