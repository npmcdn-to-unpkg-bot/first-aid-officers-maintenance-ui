'use strict';

var customFilters = require('angular').module('customFilters', []);

customFilters.filter('capitalise', function() {
  return function(input, all) {
    var reg = (all) ? /([^\W_]+[^\s-]*) */g : /([^\W_]+[^\s-]*)/;
    return (!!input) ? input.replace(reg, function(txt){
    	return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }) : '';
  };
});

module.exports = 'customFilters';