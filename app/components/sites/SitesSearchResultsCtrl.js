'use strict';
/* jshint camelcase: false*/

var _ = require('lodash');
var helper = require('./sitesSearchHelper.js');

module.exports = function ($rootScope, $scope, $location, ngDialog, busySvc, dataSvc) {
  $scope.comparisonOptions = helper.comparisonOptions;

  $scope.params = function () {
    $location.path('/sites/search');
  };

  $scope.getLink = function () {
    $rootScope.alerts.push({
      type: 'success',
      msg: 'Utilisez le lien ci-dessous (clic droit, puis <em>Copier l\'adresse du lien</em>) pour partager cette recherche ou y acc&eacute;der &agrave; tout moment,' +
        ' et avoir des r&eacute;sultats <strong>toujours &agrave; jour</strong>.<br /><hr />Alternativement, ajoutez cette page &agrave; vos favoris (<kbd>Ctrl+D</kbd>) pour un acc&egrave;s rapide.<br /><br /><a href="' +
        $location.absUrl() + '">R&eacute;sultats de la recherche</a>'
    });
  };

  function buildHeaders(display, certificates) {
    var headers = [{
      path: 'site_name',
      display: 'Nom du site'
    }];

    if (display.dept) {
      headers.push({
        path: 'dept.dept_name',
        display: 'D&eacute;partement'
      });
    }
    if (display.nb) {
      headers.push({
        path: 'stats.employeesCount',
        display: 'Agents'
      });
    }
    if (display.perm) {
      headers.push({
        path: 'stats.permanentsCount',
        display: 'CDI'
      });
    }
    _(certificates).forEach(function (cert, cert_pk) {
      var displayCert = display[cert_pk];
      if (displayCert && displayCert.nb) {
        headers.push({
          path: 'stats.certificates[' + cert_pk + '].count',
          display: cert.cert_short
        });
      }
      if (displayCert && displayCert.pc) {
        headers.push({
          path: 'stats.certificates[' + cert_pk + '].countPercentage',
          display: cert.cert_short + ' (%)'
        });
      }
    });

    return headers;
  }

  function testComparison(value, params) {
    if (params) {
      switch (params.o) {
        case 'lt':
          return value < params.d;
        case 'le':
          return value <= params.d;
        case 'eq':
          return value === params.d;
        case 'ge':
          return value >= params.d;
        case 'gt':
          return value > params.d;
      }
    }

    return true;
  }

  function testCondition(certStats, params) {
    switch (params.c) {
      case 'number':
        return testComparison(certStats.count, params);
      case 'percent':
        return testComparison(certStats.countPercentage, params);
      case 'target':
        return params.o === 'danger' ? certStats.targetStatus !== 'success' : certStats.targetStatus === params.o;
    }
  }

  function filterSite(site, filter) {
    if (!testComparison(site.stats.employeesCount, filter.nb)) {
      return false;
    }

    if (!testComparison(site.stats.permanentsCount, filter.perm)) {
      return false;
    }

    return _.every(filter.certificates, function (cert) {
      return _.every(cert.c, _.partial(testCondition, site.stats.certificates[cert.pk]));
    });
  }

  $scope.get = _.get;
  $scope.hasFiltersBesidesCert = function () {
    return _($scope.filter).omit('certificates').keys().value().length > 0;
  };

  $scope.theaders = [];
  $scope.sites = [];
  $scope.filter = {};
  $scope.display = {};

  busySvc.busy();
  busySvc.busy('sitesSearchResults', true);
  Promise.all([dataSvc.getDepartments(), dataSvc.getCertificates()]).then(function (results) {
    $scope.departments = results[0];
    $scope.filter = helper.fromURIComponent($location.search().filter);
    $scope.certificates = _.filter(helper.fillUp(_.values(results[1]), $scope.filter.certificates), 'conditions');
    $scope.display = helper.fromURIComponent($location.search().display);
    busySvc.done();

    $scope.theaders = buildHeaders($scope.display, results[1]);
    dataSvc.getSitesWithStats($scope.filter.dept).then(function (sites) {
      _(sites).filter(_.partial(filterSite, _, $scope.filter)).forEach(function (site) {
        site.dept = $scope.departments[site.site_dept_fk];
        $scope.sites.push(site);
      });

      busySvc.done('sitesSearchResults');
    });
  });
};
