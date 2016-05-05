'use strict';
/* jshint camelcase: false*/

var _ = require('lodash');
var helper = require('./employeesSearchHelper.js');
var moment = require('moment');

module.exports = function ($rootScope, $scope, $location, ngDialog, busySvc, dataSvc, dateFilter) {
  $scope.comparisonOptions = helper.comparisonOptions;
  $scope.params = function () {
    $location.path('/employees/search');
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
      path: 'empl_surname',
      display: 'Nom'
    }, {
      path: 'empl_firstname',
      display: 'Pr&eacute;nom'
    }];

    if (display.site) {
      headers.push({
        path: 'site.site_name',
        display: 'Affectation'
      });
    }

    if (display.status) {
      headers.push({
        path: 'empl_permanentDisplay',
        display: 'Statut'
      });
    }

    _(certificates).forEach(function (cert, cert_pk) {
      var displayCert = display[cert_pk];
      if (displayCert && displayCert.st) {
        headers.push({
          path: 'stats.certificates[' + cert_pk + '].validDisplay',
          display: cert.cert_short
        });
      }
      if (displayCert && displayCert.exp) {
        headers.push({
          path: 'stats.certificates[' + cert_pk + '].expiryDateDisplay',
          display: cert.cert_short + ' jusqu\'au'
        });
      }
      if (displayCert && displayCert.flnk) {
        headers.push({
          path: 'stats.certificates[' + cert_pk + '].flunked',
          display: 'Recalages/absences ' + cert.cert_short
        });
      }
    });

    return headers;
  }

  function testCondition(certStats, params) {
    switch (params.c) {
      case 'recent':
        if (!certStats) {
          return false;
        }

        var xMonthsAgo = moment(new Date()).subtract(params.d, 'months');
        if (params.o === 'danger') {
          return moment(certStats.expiryDate).isBetween(xMonthsAgo, new Date());
        }

        return _.some(certStats.trainings, function (trng) {
          return trng.trem_outcome === 'VALIDATED' && moment(trng.trng_date).isBetween(xMonthsAgo, new Date());
        });
      case 'expiring':
        if (!certStats) {
          return false;
        }

        var inXMonths = moment(new Date()).add(params.d, 'months');
        return moment(certStats.expiryDate).isBetween(new Date(), inXMonths);
      case 'expiry':
        if (!certStats) {
          return false;
        }

        return moment(certStats.expiryDate).isBetween(params.d.from, params.d.to, null, '[]');
      case 'status':
        if (!certStats) {
          return params.o === 'blank';
        }

        return params.o === certStats.validityStatus;
    }
  }

  function filterEmpl(empl, filter) {
    if (filter.perm && !empl.empl_permanent) {
      return false;
    }

    return _.every(filter.certificates, function (cert) {
      return _.every(cert.c, _.partial(testCondition, empl.stats.certificates[cert.pk]));
    });
  }

  $scope.select = function (empl_pk) {
    $location.path('/employees/' + empl_pk);
  };

  $scope.get = _.get;
  $scope.hasFiltersBesidesCert = function () {
    return _($scope.filter).omit('certificates').keys().value().length > 0;
  };

  $scope.theaders = [];
  $scope.employees = [];
  $scope.filter = {};
  $scope.display = {};

  busySvc.busy();
  busySvc.busy('employeesSearchResults', true);
  Promise.all([dataSvc.getSites(), dataSvc.getCertificates()]).then(function (results) {
    $scope.sites = results[0];
    $scope.certificates = results[1];
    $scope.filter = helper.fromURIComponent($location.search().filter);
    $scope.display = helper.fromURIComponent($location.search().display);

    $scope.theaders = buildHeaders($scope.display, results[1]);
    $scope.filterCertificates = _.filter(helper.fillUp(_.values(results[1]), $scope.filter.certificates), 'conditions');
    busySvc.done();

    dataSvc.getEmployeesWithStats($scope.filter.site).then(function (employees) {
      _(employees).filter(_.partial(filterEmpl, _, $scope.filter)).forEach(function (empl) {
        empl.site = $scope.sites[empl.siem_site_fk];
        empl.empl_permanentDisplay = empl.empl_permanent ? 'CDI' : 'CDD';
        _(empl.stats.certificates).forEach(function (certStats) {
          certStats.expiryDateDisplay = dateFilter(new Date(certStats.expiryDate), 'dd/MM/yyyy');
          certStats.validDisplay = certStats.valid ? 'Valide' : 'Expirée';
          certStats.flunked = _.countBy(certStats.trainings, 'trem_outcome').FLUNKED;
        });

        $scope.employees.push(empl);
      });

      busySvc.done('employeesSearchResults');
    });
  });

  $scope.changeDisplay = function () {
    var dialogScope = $scope.$new();
    dialogScope.display = _($scope.display).cloneDeep();
    dialogScope.callback = function (display) {
      $scope.display = display;
      $location.search('display', helper.toURIComponent($scope.display)).replace();
      $scope.theaders = buildHeaders($scope.display, $scope.certificates);
    };

    ngDialog.open({
      template: './components/dialogs/employees_search_display.html',
      scope: dialogScope
    });
  };
};
