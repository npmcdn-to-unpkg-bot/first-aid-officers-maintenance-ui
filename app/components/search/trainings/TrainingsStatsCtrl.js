'use strict';
/*jshint camelcase: false*/

var _ = require('lodash');
var moment = require('moment');

module.exports = function ($scope, dataSvc, dateFilter, busySvc, ngDialog) {
  $scope.params = {
    beginning: undefined,
    end: undefined,
    intervals: [],
    availableIntervals: []
  };

  busySvc.busy();
  Promise.all([dataSvc.getTrainingTypes(), dataSvc.getCertificates()]).then(function (results) {
    $scope.trainingTypes = results[0];
    $scope.certificates = results[1];
    busySvc.done();
  }, function () {
    busySvc.done();
  });

  $scope.getIntervalDisplay = function (interval) {
    switch (interval) {
      case 0:
        return 'période entière';
      case 12:
        return 'année';
      case 6:
        return 'semestre';
      case 3:
        return 'trimestre';
      default:
        return 'mois';
    }
  };

  $scope.openDetails = function (period, certificate, statistics) {
    var dialogScope = $scope.$new();
    dialogScope.period = period;
    dialogScope.certificate = certificate;
    dialogScope.statistics = statistics;
    dialogScope.hasMultipleTypes = statistics && _.keys(statistics.trainingTypesStatistics).length > 0 && _.filter($scope.trainingTypes, function (trainingType) {
      return _.find(trainingType.certificates, { cert_pk: certificate.cert_pk });
    }).length > 1;
    ngDialog.open({
      template: './components/dialogs/trainings_certificate_statistics.html',
      scope: dialogScope
    });
  };

  $scope.getDatesRangeDisplay = function (interval, beginning, end) {
    var _beginning = moment(beginning);
    var _dateFilter;
    if (interval === 0) {
      _dateFilter = _.partialRight(dateFilter, 'longDate');
    } else if (interval === 12 && _beginning.dayOfYear() === 1) {
      return dateFilter(beginning, 'yyyy');
    } else if (interval === 1 && _beginning.date() === 1) {
      return dateFilter(beginning, 'MMMM');
    } else if (interval < 6) {
      _dateFilter = _.partialRight(dateFilter, 'MMM');
    } else {
      _dateFilter = _.partialRight(dateFilter, 'MMM yyyy');
    }

    return _dateFilter(beginning) + ' - ' + _dateFilter(end);
  };

  $scope.edit = function () {
    ngDialog.open({ scope: $scope, template: './components/dialogs/trainings_statistics.html' });
  };

  $scope.generate = function () {
    ngDialog.closeAll();
    busySvc.busy();
    dataSvc.getTrainingsStats(dateFilter($scope.params.beginning, 'yyyy-MM-dd'), dateFilter($scope.params.end, 'yyyy-MM-dd'), [0].concat($scope.params.intervals)).then(
      function (results) {
        var stats = _(results).map(function (stats, interval) {
          return { stats: stats, interval: parseInt(interval) };
        }).orderBy('interval', 'desc').value();

        stats = [_.last(stats)].concat(_.take(stats, stats.length - 1));
        $scope.columns = _.last(stats).stats.length;
        var smallestInterval = _.last(stats).interval;
        $scope.stats = _.map(stats, function (stats) {
          return _.extend({ colSpan: stats.interval / smallestInterval }, stats);
        });

        busySvc.done();
      },
      function () {
        busySvc.done();
      });
  };

  $scope.$watchCollection('params.intervals', function (intervals) {
    $scope.params.availableIntervals = _.difference([1, 3, 6, 12], intervals);
  });
};
