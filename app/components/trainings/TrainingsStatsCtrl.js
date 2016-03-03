'use strict';
/*jshint camelcase: false*/

var _ = require('lodash');
var moment = require('moment');

module.exports = function ($scope, $rootScope, dataSvc, dateFilter, busySvc) {
  busySvc.busy();

  Promise.all([dataSvc.getTrainingsStats('2015-01-01', '2016-05-15'), dataSvc.getTrainingTypes(), dataSvc.getCertificates()]).then(function (results) {
    $scope.globalStats = results[0][0];
    $scope.stats = _(results[0]).map(function (stats, interval) {
      return { stats: stats, interval: parseInt(interval) };
    }).reject(function (stats) {
      return stats.interval === 0;
    }).orderBy('interval', 'desc').value();
    $scope.columns = _.range(0, _.last($scope.stats).stats.length);
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
