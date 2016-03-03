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
