'use strict';
/* jshint camelcase: false*/

var _ = require('lodash');
var helper = require('./trainingsSearchHelper.js');
var moment = require('moment');

module.exports = function ($rootScope, $scope, $location, ngDialog, busySvc, dataSvc, dateFilter) {
  $scope.comparisonOptions = helper.comparisonOptions;
  $scope.params = function () {
    $location.path('/trainings/search');
  };

  $scope.getLink = function () {
    $rootScope.alerts.push({
      type: 'success',
      msg: 'Utilisez le lien ci-dessous (clic droit, puis <em>Copier l\'adresse du lien</em>) pour partager cette recherche ou y acc&eacute;der &agrave; tout moment,' +
        ' et avoir des r&eacute;sultats <strong>toujours &agrave; jour</strong>.<br /><hr />Alternativement, ajoutez cette page &agrave; vos favoris (<kbd>Ctrl+D</kbd>) pour un acc&egrave;s rapide.<br /><br /><a href="' +
        $location.absUrl() + '">R&eacute;sultats de la recherche</a>'
    });
  };

  function buildHeaders(display) {
    var headers = [{
      path: 'type.trty_name',
      display: 'Type de formation'
    }];

    if (display.start) {
      headers.push({
        path: 'start',
        sort: 'trng_start',
        display: 'Date de début'
      });
    }

    headers.push({
      path: 'date',
      sort: 'trng_date',
      display: 'Date de ' + (display.start ? 'fin' : 'formation')
    });

    if (display.status) {
      headers.push({
        path: 'status',
        display: 'Statut'
      });
    }

    if (display.registered) {
      headers.push({
        path: 'registered',
        display: 'Inscrits'
      });
    }

    if (display.validated) {
      headers.push({
        path: 'validated',
        display: 'Validés'
      });
    }

    if (display.flunked) {
      headers.push({
        path: 'flunked',
        display: 'Recalés/absents'
      });
    }

    return headers;
  }

  function testComparison(value, params) {
    if (params) {
      switch (params.o) {
        case 'lt':
          return value < params.d;
        case 'eq':
          return value === params.d;
        case 'gt':
          return value > params.d;
      }
    }

    return true;
  }

  function filterTrng(training, filter) {
    if (filter.status) {
      if (filter.status === 'over' && training.trng_outcome !== 'COMPLETED') {
        return false;
      }

      if (filter.status === 'schd' && training.trng_outcome !== 'SCHEDULED') {
        return false;
      }
    }

    if (filter.nb) {
      if (!testComparison(training.registered, filter.nb)) {
        return false;
      }
    }

    if (filter.scdd) {
      if (!testComparison(training.validated, filter.scdd)) {
        return false;
      }
    }

    if (filter.flkd) {
      if (!testComparison(training.flunked, filter.flkd)) {
        return false;
      }
    }

    return true;
  }

  $scope.select = function (trng_pk) {
    $location.path('/trainings/' + trng_pk);
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
  busySvc.busy('trainingsSearchResults', true);
  Promise.all([dataSvc.getTrainingTypes(), dataSvc.getCertificates()]).then(function (results) {
    $scope.trainingTypes = results[0];
    $scope.certificates = results[1];
    $scope.filter = helper.fromURIComponent($location.search().filter);
    $scope.display = helper.fromURIComponent($location.search().display);

    $scope.theaders = buildHeaders($scope.display);
    busySvc.done();

    var from, to;
    if ($scope.filter.date) {
      switch ($scope.filter.date.o) {
        case 'specific':
          from = new Date($scope.filter.date.from);
          to = new Date($scope.filter.date.to);
          break;
        case 'soon':
          from = new Date();
          to = moment(from).add($scope.filter.date.data, 'months').toDate();
          break;
        case 'recent':
          to = new Date();
          from = moment(to).subtract($scope.filter.date.data, 'months').toDate();
          break;
      }
    }

    dataSvc.getTrainings($scope.filter.trtys, from, to).then(function (trainings) {
      $scope.trainings = _(trainings).filter(_.partial(filterTrng, _, $scope.filter)).forEach(function (training) {
        training.status = training.trng_outcome === 'COMPLETED' ? 'Réalisée' : 'Prévue';
        training.type = $scope.trainingTypes[training.trng_trty_fk];
        training.start = dateFilter(training.trng_start, 'dd/MM/yyyy');
        training.date = dateFilter(training.trng_date, 'dd/MM/yyyy');
      });

      busySvc.done('trainingsSearchResults');
    });
  });

  $scope.changeDisplay = function () {
    var dialogScope = $scope.$new(true);
    dialogScope.display = _($scope.display).cloneDeep();
    dialogScope.callback = function (display) {
      $scope.display = display;
      $location.search('display', helper.toURIComponent($scope.display)).replace();
      $scope.theaders = buildHeaders($scope.display);
    };

    ngDialog.open({
      template: './components/dialogs/trainings_search_display.html',
      scope: dialogScope
    });
  };
};
