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

customFilters.filter('dateFull', function () {
	return function (input) {
		if(input !== undefined) {
			return moment(input).format('LL');
		}
	};
});

customFilters.filter('filterSite', function () {
  return function (sites, inputString) {
    inputString = inputString.toUpperCase();
    return _.filter(sites, function (site) {
      var siteSummary = site.site_name.toUpperCase();
      return _.every(inputString.split(' '), function(split) {
        return siteSummary.indexOf(split) !== -1;
      });
    });
  };
});

module.exports = 'customFilters';