'use strict';
/*jshint camelcase: false*/

var customFilters = require('angular').module('customFilters', []);
var moment = require('moment');
var _ = require('underscore');

customFilters.filter('capitalise', function() {
  return function(input, all) {
    var reg = (all) ? /([^\W_]+[^\s-]*) */g : /([^\W_]+[^\s-]*)/;
    return (!!input) ? input.replace(reg, function(txt){
    	return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }) : '';
  };
});

function summariseSite (site) {
  return site.site_name;
}

function summariseEmpl (empl) {
  return empl.empl_pk + ' - ' + empl.empl_firstname + ' ' + empl.empl_surname;
}

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

customFilters.filter('filterGlobal', function () {
  return function (entries, inputString) {
    inputString = inputString.toUpperCase();
    return _.map(_.filter(entries, function (entry) {
      if (entry.site_pk) {
        var siteSummary = summariseSite(entry).toUpperCase();
        return _.every(inputString.split(' '), function(split) {
          return siteSummary.indexOf(split) !== -1;
        });
      } else {
        var empl_summary = summariseEmpl(entry).toUpperCase();
        return _.every(inputString.split(' '), function(split) {
          return empl_summary.indexOf(split) !== -1;
        });
      }
    }), function (entry) {
      return entry.summary = (entry.site_pk) ? summariseSite(entry) : summariseEmpl(entry), entry;
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