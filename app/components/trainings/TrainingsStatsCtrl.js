'use strict';
/*jshint camelcase: false*/

var _ = require('lodash');
var moment = require('moment');

module.exports = function ($scope, $rootScope, dataSvc, dateFilter, busySvc) {
  $scope.intervals = [];

  $scope.generate = function () {
    busySvc.busy();
    Promise.all([dataSvc.getTrainingsStats(dateFilter($scope.beginning, 'yyyy-MM-dd'), dateFilter($scope.end, 'yyyy-MM-dd'), [0].concat($scope.intervals)), dataSvc.getTrainingTypes(), dataSvc.getCertificates()]).then(function (results) {
      $scope.globalStats = results[0][0];
      $scope.stats = _(results[0]).map(function (stats, interval) {
        return { stats: stats, interval: parseInt(interval) };
      }).orderBy('interval', 'desc').value();
      $scope.stats = [_.last($scope.stats)].concat(_.take($scope.stats, $scope.stats.length - 1));
      $scope.columns = _.last($scope.stats).stats.length;
      var smallestInterval = _.last($scope.stats).interval;
      $scope.stats = _.map($scope.stats, function (stats) {
        return _.extend({ colSpan: stats.interval / smallestInterval }, stats);
      });
      $scope.certificates = results[2];
      busySvc.done();
    }, function () {
      busySvc.done();
    });
  };

  $scope.$watchCollection('intervals', function (intervals) {
    $scope.availableIntervals = _.difference([1, 3, 6, 12], intervals);
  });
};
