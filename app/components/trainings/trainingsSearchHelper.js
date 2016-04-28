'use strict';
/*jshint camelcase: false*/

var _ = require('lodash');
var lzString = require('lz-string');

var comparisonOptions = [{
  value: 'lt',
  short: '<',
  display: 'inférieur à'
}, {
  value: 'eq',
  short: '=',
  display: 'égal à'
}, {
  value: 'gt',
  short: '>',
  display: 'supérieur à'
}];

var datesOptions = [{
  value: 'soon',
  display: 'Prévue prochainement'
}, {
  value: 'recent',
  display: 'Prévue/réalisée récemment'
}, {
  value: 'specific',
  display: 'Prévue/réalisée sur certaines dates'
}];

module.exports = {
  comparisonOptions: comparisonOptions,
  datesOptions: datesOptions,

  toURIComponent: function (obj) {
    return lzString.compressToEncodedURIComponent(JSON.stringify(_(obj).omitBy(_.isUndefined).omitBy(_.isNull).value()));
  },

  fromURIComponent: function (str) {
    return JSON.parse(lzString.decompressFromEncodedURIComponent(str) || '{}');
  }
};
