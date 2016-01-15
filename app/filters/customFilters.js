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

function summariseTrng (trng) {
  return trng.type.trty_name + ' - ' + trng.trng_displayDate;
}

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