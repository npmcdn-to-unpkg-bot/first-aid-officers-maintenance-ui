'use strict';
/*jshint camelcase: false*/

var _ = require('lodash');
var helper = require('./employeesConditionsHelper.js');

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

  $scope.colFor = function (filter) {
    return _.find($scope.cols, function (col) {
      return _.find(col, filter);
    });
  };

  function updateSearch() {
    $location.search(_.extend(_.mapKeys($scope.tp.url(), _.flow(_.nthArg(1), decodeURI)), { conditions: helper.toURIComponent(helper.stripDown($scope.conditions)) })).replace();
  }

  busySvc.busy('employees');
  Promise.all([dataSvc.getCertificates(), dataSvc.getSites(), dataSvc.getEmployeesWithStats()]).then(_.spread(function (certificates, sites, employees) {
    $scope.certificates = $scope.certificates = _.values(certificates);
    $scope.sites = sites;
    $scope.employees = _.values(_.each(employees, function (empl) {
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

    // Restore status from URL search parameters and initiliaze table parameters
    $scope.conditions = helper.fillUp(helper.fromURIComponent($location.search().conditions), certificates);
    $scope.tp = new NgTableParams(_.omit(_.extend({ sorting: { empl_surname: 'asc' }, count: 10 }, $location.search()), 'conditions'), {
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

  $scope.select = function (empl_pk) {
    $location.path('/employees/' + empl_pk).search({});
  };

  $scope.selectSite = function (site_pk) {
    $location.path('/sites/' + site_pk).search({});
  };
};
