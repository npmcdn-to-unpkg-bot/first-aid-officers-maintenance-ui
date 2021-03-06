'use strict';
/*jshint camelcase: false*/

var _ = require('lodash');

// TODO: reject deferred promises on fail
// OR SIMPLY NOT USE $q.defer()
// SEE http://www.codelord.net/2015/09/24/$q-dot-defer-youre-doing-it-wrong/
module.exports = function ($http, $q, apiSvc, $filter) {

  var dataSvc = {};
  var dateFilter = $filter('date');

  dataSvc.getDepartments = function () {
    return apiSvc.get(apiSvc.resourcesByKeysEndpoint + 'departments');
  };

  dataSvc.getAllDepartments = function () {
    return apiSvc.get(apiSvc.resourcesByKeysEndpoint + 'departments?unlisted=true');
  };

  dataSvc.getLatestUpdate = function () {
    return apiSvc.get(apiSvc.resourcesEndpoint + 'update');
  };

  dataSvc.getEmployee = function (empl_pk) {
    var deferred = $q.defer();
    Promise.all([apiSvc.get(apiSvc.resourcesEndpoint + 'employees/' + empl_pk), apiSvc.get(apiSvc.statisticsEndpoint + 'employees/' + empl_pk)]).then(function (results) {
      var res = results[0];
      res.stats = _.first(_.values(results[1]));
      deferred.resolve(res);
    });

    return deferred.promise;
  };

  dataSvc.getEmployeeCertificatesVoiding = function (empl_pk) {
    return apiSvc.get(apiSvc.resourcesEndpoint + 'employees/' + empl_pk + '/voiding');
  };

  dataSvc.getSite = function (site_pk) {
    return apiSvc.get(apiSvc.resourcesEndpoint + 'sites/' + site_pk);
  };

  dataSvc.getEmployeeSite = function (empl_pk) {
    var deferred = $q.defer();
    apiSvc.get(apiSvc.resourcesEndpoint + 'sites?employee=' + empl_pk).then(function (sites) {
      deferred.resolve(_.first(sites));
    });

    return deferred.promise;
  };

  dataSvc.getSiteWithStats = function (site_pk) {
    var deferred = $q.defer();
    Promise.all([apiSvc.get(apiSvc.resourcesEndpoint + 'sites/' + site_pk), apiSvc.get(apiSvc.statisticsEndpoint + 'sites/' + site_pk)]).then(function (results) {
      var res = results[0];
      res.stats = _.first(_.values(results[1]));
      deferred.resolve(res);
    });

    return deferred.promise;
  };

  dataSvc.getSiteStatsHistory = function (site_pk, from) {
    return apiSvc.get(apiSvc.statisticsEndpoint + 'sites/' + site_pk + '?from=' + dateFilter(from, 'yyyy-MM-dd') + '&interval=1');
  };

  dataSvc.getSiteEmployees = function (site_pk) {
    return apiSvc.get(apiSvc.resourcesByKeysEndpoint + 'employees?site=' + site_pk);
  };

  dataSvc.getSiteEmployeesWithStats = function (site_pk) {
    var deferred = $q.defer();
    Promise.all([apiSvc.get(apiSvc.resourcesByKeysEndpoint + 'employees?site=' + site_pk), apiSvc.get(apiSvc.statisticsEndpoint + 'employees?site=' + site_pk)])
      .then(function (results) {
        var res = results[0];
        _.each(_.first(_.values(results[1])), function (stats, empl_pk) {
          res[empl_pk].stats = stats;
        });

        deferred.resolve(res);
      });

    return deferred.promise;
  };

  dataSvc.getSites = function (dept_pk) {
    return apiSvc.get(apiSvc.resourcesByKeysEndpoint + 'sites' + (dept_pk ? '?department=' + dept_pk : ''));
  };

  dataSvc.getAllSites = function () {
    return apiSvc.get(apiSvc.resourcesByKeysEndpoint + 'sites?unlisted=true');
  };

  dataSvc.getSitesWithStats = function (dept_pk) {
    var deferred = $q.defer();
    Promise.all([dataSvc.getSites(dept_pk), apiSvc.get(apiSvc.statisticsEndpoint + 'sites' + (dept_pk ? '?department=' + dept_pk : ''))]).then(function (results) {
      var res = results[0];
      _.each(_.first(_.values(results[1])), function (stats, site_pk) {
        res[site_pk].stats = stats;
      });

      deferred.resolve(res);
    });

    return deferred.promise;
  };

  dataSvc.getEmployees = function (site_pk) {
    var deferred = $q.defer();
    Promise.all([dataSvc.getSites(), apiSvc.get(apiSvc.resourcesByKeysEndpoint + 'employees' + (site_pk ? '?site=' + site_pk : ''))]).then(function (results) {
      deferred.resolve(_.each(results[1], function (empl) {
        empl.site = results[0][empl.siem_site_fk];
      }));
    });

    return deferred.promise;
  };

  dataSvc.getEmployeesWithStats = function (site_pk) {
    var deferred = $q.defer();
    Promise.all([dataSvc.getEmployees(site_pk), apiSvc.get(apiSvc.statisticsEndpoint + 'employees' + (site_pk ? '?site=' + site_pk : ''))]).then(function (results) {
      var res = results[0];
      _.each(_.first(_.values(results[1])), function (stats, empl_pk) {
        res[empl_pk].stats = stats;
      });

      deferred.resolve(res);
    });

    return deferred.promise;
  };

  dataSvc.getEmployeeTrainings = function (empl_pk) {
    var deferred = $q.defer();
    apiSvc.get(apiSvc.resourcesByKeysEndpoint + 'trainings?employee=' + empl_pk, 'employees[\'' + empl_pk + '\'].trainings').then(function (trainings) {
      _.each(trainings, function (training) {
        if (training.trng_start) {
          var dateFromFormat;
          if (dateFilter(training.trng_start, 'yyyy') !== dateFilter(training.trng_date, 'yyyy')) {
            dateFromFormat = 'longDate';
          } else {
            dateFromFormat = dateFilter(training.trng_start, 'M') === dateFilter(training.trng_date, 'M') ? 'd' : 'd MMMM';
          }
          training.trng_displayDate = 'du ' + dateFilter(training.trng_start, dateFromFormat) + ' au ' + dateFilter(training.trng_date, 'longDate');
        } else {
          training.trng_displayDate = dateFilter(training.trng_date, 'fullDate');
        }
      });

      deferred.resolve(trainings);
    });

    return deferred.promise;
  };

  dataSvc.getCertificates = function () {
    return apiSvc.get(apiSvc.resourcesByKeysCommonEndpoint + 'certificates');
  };

  dataSvc.getTrainingTypes = function () {
    var deferred = $q.defer();
    Promise.all([apiSvc.get(apiSvc.resourcesByKeysCommonEndpoint + 'trainingtypes'), apiSvc.get(apiSvc.resourcesByKeysCommonEndpoint + 'trainingtypes_certificates'), dataSvc.getCertificates()])
      .then(function (results) {
        var res = results[0];
        _.each(results[1], function (certificates, trty_pk) {
          res[trty_pk].certificates = _.map(certificates, function (cert_pk) {
            return results[2][cert_pk];
          });
        });

        deferred.resolve(res);
      });

    return deferred.promise;
  };

  dataSvc.getTrainings = function (types, from, to) {
    var deferred = $q.defer();
    var queryParams = types && types.length > 0 ? '?type=' + _.join(types, '&type=') : '';
    if (from) {
      queryParams += (queryParams === '' ? '?from=' : '&from=') + dateFilter(from, 'yyyy-MM-dd');
    }

    if (to) {
      queryParams += (queryParams === '' ? '?to=' : '&to=') + dateFilter(to, 'yyyy-MM-dd');
    }

    apiSvc.get(apiSvc.resourcesByKeysEndpoint + 'trainings' + queryParams).then(function (trainings) {
      _.each(_.values(trainings), function (training) {
        if (training.trng_start) {
          var dateFromFormat;
          if (dateFilter(training.trng_start, 'yyyy') !== dateFilter(training.trng_date, 'yyyy')) {
            dateFromFormat = 'longDate';
          } else {
            dateFromFormat = dateFilter(training.trng_start, 'M') === dateFilter(training.trng_date, 'M') ? 'd' : 'd MMMM';
          }
          training.trng_displayDate = 'du ' + dateFilter(training.trng_start, dateFromFormat) + ' au ' + dateFilter(training.trng_date, 'longDate');
        } else {
          training.trng_displayDate = dateFilter(training.trng_date, 'fullDate');
        }
      });

      deferred.resolve(trainings);
    });

    return deferred.promise;
  };

  dataSvc.getTraining = function (trng_pk) {
    var deferred = $q.defer();
    Promise.all([apiSvc.get(apiSvc.resourcesEndpoint + 'trainings/' + trng_pk), apiSvc.get(apiSvc.resourcesByKeysEndpoint + 'employees?training=' + trng_pk)])
      .then(function (results) {
        var res = results[0];
        res.trainees = results[1];
        Promise.all(_.map(res.trainers, function (empl_pk) {
          return apiSvc.get(apiSvc.resourcesEndpoint + 'employees/' + empl_pk);
        })).then(function (results) {
          res.trainers = results;
          deferred.resolve(res);
        });
      });

    return deferred.promise;
  };

  dataSvc.getTrainingsStats = function (from, to, intervals) {
    return apiSvc.get(apiSvc.statisticsEndpoint + 'trainings?from=' + from + '&to=' + to + '&interval=' + intervals.join('&interval='));
  };

  return dataSvc;
};
