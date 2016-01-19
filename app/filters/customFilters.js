'use strict';
/*jshint camelcase: false*/

var customFilters = require('angular').module('customFilters', []);
var moment = require('moment');
var _ = require('underscore');

function summariseSite (site) {
  return site.site_name;
}

function summariseEmpl (empl) {
  return empl.empl_pk + ' - ' + empl.empl_firstname + ' ' + empl.empl_surname;
}

function summariseTrng (trng) {
  return trng.type.trty_name + ' - ' + trng.trng_displayDate;
}

customFilters.filter('filterEmpl', function () {
  return function (employees, inputString) {
    inputString = inputString.toUpperCase();
    return _.map(_.filter(employees, function (empl) {
      var empl_summary = summariseEmpl(empl).toUpperCase();
      return _.every(inputString.split(' '), function(split) {
        return empl_summary.indexOf(split) !== -1;
      });
    }), function (entry) {
      return entry.summary = (entry.site_pk) ? summariseSite(entry) : summariseEmpl(entry), entry;
    });
  };
});

customFilters.filter('filterSite', function () {
  return function (sites, inputString) {
    inputString = inputString.toUpperCase();
    return _.map(_.filter(sites, function (site) {
      var siteSummary = summariseSite(site).toUpperCase();
      return _.every(inputString.split(' '), function(split) {
        return siteSummary.indexOf(split) !== -1;
      });
    }), function (entry) {
      return entry.summary = (entry.site_pk) ? summariseSite(entry) : summariseEmpl(entry), entry;
    });
  };
});

customFilters.filter('filterGlobal', function () {
  return function (entries, inputString) {
    inputString = inputString.toUpperCase();
    return _.map(_.filter(entries, function (entry) {
      var summary;
      if (entry.site_pk) {
        summary = summariseSite(entry).toUpperCase();
      } else if (entry.empl_pk) {
        summary = summariseEmpl(entry).toUpperCase();
      } else {
        summary = summariseTrng(entry).toUpperCase();
      }

      return _.every(inputString.split(' '), function(split) {
        return summary.indexOf(split) !== -1;
      });
    }), function (entry) {
      if (entry.site_pk) {
        entry.summary = summariseSite(entry);
      } else if (entry.empl_pk) {
        entry.summary = summariseEmpl(entry);
      } else {
        entry.summary = summariseTrng(entry);
      }

      return entry;
    });
  };
});

customFilters.filter('fromNow', function () {
  return function (input) {
    if(input !== undefined) {
      return moment(input).from(moment().set({'hour': 0, 'minute': 0, 'second': 0, 'millisecond': 0}));
    }
  };
});

module.exports = 'customFilters';