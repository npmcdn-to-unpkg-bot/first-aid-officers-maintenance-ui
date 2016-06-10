'use strict';
/*jshint camelcase: false*/

var _ = require('lodash');
var moment = require('moment');
var lzString = require('lz-string');

module.exports = {
  datesOptions: [{
    value: 'soon',
    display: 'Prévue prochainement'
  }, {
    value: 'recent',
    display: 'Prévue/réalisée récemment'
  }, {
    value: 'specific',
    display: 'Prévue/réalisée sur certaines dates'
  }],
  isValid: function (dateOption, params) {
    switch (dateOption) {
      case 'soon':
      case 'recent':
        return params.data > 0;
      case 'specific':
        return params.from && params.to && !isNaN(params.from.getTime()) && !isNaN(params.to.getTime());
    }
  },
  testCondition: function (trng, params) {
    switch (params.option) {
      case 'soon':
        return moment(trng.trng_date).isBetween(moment(), moment().add(params.data, 'months'));
      case 'recent':
        return moment(trng.trng_start || trng.trng_date).isBetween(moment().subtract(params.data, 'months'), moment());
      case 'specific':
        return moment(trng.trng_date).isBetween(params.from, params.to, null, '[]');
    }
  },
  toURIComponent: function (obj) {
    if (obj) {
      return lzString.compressToEncodedURIComponent(JSON.stringify(_.omitBy(obj, _.isNil)));
    }
  },
  fromURIComponent: function (str) {
    if (str) {
      return JSON.parse(lzString.decompressFromEncodedURIComponent(str));
    }
  }
};
