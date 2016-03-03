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
