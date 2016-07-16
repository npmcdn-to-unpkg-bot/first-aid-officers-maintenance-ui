'use strict';
/*jshint camelcase: false*/

var customFilters = require('angular').module('customFilters', []);
var moment = require('moment');
var _ = require('lodash');

function summariseDept(dept) {
  return dept.dept_name;
}

function summariseSite(site) {
  return site.site_name;
}

function summariseEmpl(empl) {
  return empl.empl_pk + ' - ' + empl.empl_surname + ' ' + empl.empl_firstname + ' - ' + empl.site.site_name;
}

function summariseTrng(trng) {
  return trng.type.trty_name + ' - ' + trng.trng_displayDate;
}

customFilters.filter('capitalize', _.constant(function (input) {
  return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
}));

customFilters.filter('omitEmptyKeys', _.constant(_.partialRight(_.omitBy, _.overSome(_.isNil, _.partial(_.isEqual, _, '')))));

customFilters.filter('filterEmpl', function () {
  return function (employees, inputString) {
    inputString = inputString.toUpperCase();
    return _.sortBy(_.map(_.filter(employees, function (empl) {
      var empl_summary = summariseEmpl(empl).toUpperCase();
      return _.every(inputString.split(' '), function (split) {
        return empl_summary.indexOf(split) !== -1;
      });
    }), function (entry) {
      return entry.summary = summariseEmpl(entry), entry;
    }), function (entry) {
      var surnameMatchIdx = entry.empl_surname.indexOf(inputString.split(' ')[0]);
      if (surnameMatchIdx !== -1) {
        return '0' + surnameMatchIdx + entry.empl_surname + entry.empl_firstname;
      }

      return '1' + entry.empl_surname;
    });
  };
});

customFilters.filter('orderByNullLast', function () {
  return function (array, key, reverse) {
    var res = _.partition(array, function (entry) {
      var gotten = _.get(entry, key);
      return gotten !== undefined && gotten !== null;
    });

    var sorted = _.sortBy(res[0], function (entry) {
      return _.get(entry, key);
    });

    if (reverse) {
      sorted = _.reverse(sorted);
    }

    return sorted.concat(res[1]);
  };
});

customFilters.filter('filterDept', function () {
  return function (departments, inputString) {
    inputString = inputString.toUpperCase();
    return _.map(_.filter(departments, function (dept) {
      var deptSummary = summariseDept(dept).toUpperCase();
      return _.every(inputString.split(' '), function (split) {
        return deptSummary.indexOf(split) !== -1;
      });
    }), function (entry) {
      return entry.summary = summariseDept(entry), entry;
    });
  };
});

customFilters.filter('filterSite', function () {
  return function (sites, inputString) {
    inputString = inputString.toUpperCase();
    return _.map(_.filter(sites, function (site) {
      var siteSummary = summariseSite(site).toUpperCase();
      return _.every(inputString.split(' '), function (split) {
        return siteSummary.indexOf(split) !== -1;
      });
    }), function (entry) {
      return entry.summary = summariseSite(entry), entry;
    });
  };
});

customFilters.filter('filterGlobal', function () {
  return function (entries, inputString) {
    inputString = inputString.toUpperCase();
    var res = _.groupBy(_.map(_.filter(entries, function (entry) {
      var summary;
      if (entry.site_pk) {
        summary = summariseSite(entry).toUpperCase();
        entry.__type = 'site';
      } else if (entry.empl_pk) {
        summary = summariseEmpl(entry).toUpperCase();
        entry.__type = 'empl';
      } else {
        summary = summariseTrng(entry).toUpperCase();
        entry.__type = 'trng';
      }

      return _.every(inputString.split(' '), function (split) {
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
    }), '__type');

    var sites = _.sortBy(res.site, 'summary');
    var trngs = _.sortBy(res.trng, 'trng_date').reverse();
    var empls = _.sortBy(res.empl, function (entry) {
      var surnameMatchIdx = entry.empl_surname.indexOf(inputString.split(' ')[0]);
      if (surnameMatchIdx !== -1) {
        return '0' + surnameMatchIdx + entry.empl_surname + entry.empl_firstname;
      }

      return '1' + entry.empl_surname;
    });

    return sites.concat(trngs).concat(empls);
  };
});

customFilters.filter('fromNow', function () {
  return function (input) {
    if (input !== undefined) {
      return moment(input).from(moment().set({ 'hour': 0, 'minute': 0, 'second': 0, 'millisecond': 0 }));
    }
  };
});

module.exports = 'customFilters';
