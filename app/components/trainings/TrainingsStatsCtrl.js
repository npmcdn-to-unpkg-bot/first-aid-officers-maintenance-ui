'use strict';
/*jshint camelcase: false*/

var _ = require('lodash');
var moment = require('moment');

module.exports = function ($scope, $rootScope, dataSvc, dateFilter, busySvc) {
  $scope.intervals = [];

  busySvc.busy();
  dataSvc.getCertificates().then(function (results) {
    $scope.certificates = results;
    busySvc.done();
  }, function () {
    busySvc.done();
  });

  $scope.getIntervalDisplay = function (interval, beginning, end) {
    var _beginning = moment(beginning);
    var _dateFilter;
    if (interval === 0) {
      _dateFilter = _.partialRight(dateFilter, 'fullDate')
    } else if (interval === 12 && _beginning.dayOfYear() === 1) {
      return dateFilter(beginning, 'yyyy');
    } else if (interval === 1 && _beginning.date() === 1) {
      return dateFilter(beginning, 'MMMM');
    } else if (interval < 6) {
      _dateFilter = _.partialRight(dateFilter, 'MMM')
    } else {
      _dateFilter = _.partialRight(dateFilter, 'MMM yyyy')
    }

    return _dateFilter(beginning) + ' - ' + _dateFilter(end);
  };

  $scope.generate = function () {
    busySvc.busy();
    dataSvc.getTrainingsStats(dateFilter($scope.beginning, 'yyyy-MM-dd'), dateFilter($scope.end, 'yyyy-MM-dd'), [0].concat($scope.intervals)).then(function (results) {
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
    }, function () {
      busySvc.done();
    });
  };

  $scope.$watchCollection('intervals', function (intervals) {
    $scope.availableIntervals = _.difference([1, 3, 6, 12], intervals);
  });
};
