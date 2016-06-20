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

var targetOptions = [{
  value: 'success',
  display: 'Atteinte'
}, {
  value: 'warning',
  display: 'Atteinte aux deux tiers'
}, {
  value: 'danger',
  display: 'Non atteinte'
}];

var certificatesConditions = [{
  value: 'target',
  display: 'Par rapport à la cible'
}, {
  value: 'number',
  display: 'Nombre d\'agents formés'
}, {
  value: 'percent',
  display: 'Taux d\'agents formés'
}];

function getConditionDisplay(cert, params) {
  switch (params.condition.value) {
    case 'number':
      return 'Agents ' + cert.cert_short + ' ' + params.option.short + ' ' + params.data;
    case 'percent':
      return 'Taux ' + cert.cert_short + ' ' + params.option.short + ' ' + params.data + '%';
    case 'target':
      return 'Cible ' + cert.cert_short + ' est ' + params.option.display.toLowerCase();
  }
}

function testComparison(value, params) {
  if (params) {
    switch (params.option.value) {
      case 'lt':
        return value < params.data;
      case 'eq':
        return value === params.data;
      case 'gt':
        return value > params.data;
    }
  }

  return true;
}

module.exports = {
  comparisonOptions: comparisonOptions,
  targetOptions: targetOptions,
  certificatesConditions: certificatesConditions,
  getConditionDisplay: getConditionDisplay,

  testCondition: function (certStats, params) {
    switch (params.condition.value) {
      case 'number':
        return testComparison(certStats.count, params);
      case 'percent':
        return testComparison(certStats.countPercentage, params);
      case 'target':
        return params.option.value === 'danger' ? certStats.targetStatus !== 'success' : certStats.targetStatus === params.option.value;
    }
  },

  stripDown: function (conditions) {
    return _.map(conditions, function (condition) {
      return {
        c: condition.params.condition.value,
        o: condition.params.option ? condition.params.option.value : undefined,
        d: condition.params.data,
        cert: condition.cert.cert_pk
      };
    });
  },

  fillUp: function (conditions, certificates) {
    return _.map(conditions, function (condition) {
      var params = {
        condition: _(certificatesConditions).find({ value: condition.c }),
        option: condition.c === 'target' ? _(targetOptions).find({ value: condition.o }) : _(comparisonOptions).find({ value: condition.o }),
        data: condition.d
      };

      return {
        params: params,
        display: getConditionDisplay(certificates[condition.cert], params),
        cert: certificates[condition.cert]
      };
    });
  },

  toURIComponent: function (obj) {
    return lzString.compressToEncodedURIComponent(JSON.stringify(_(obj).omitBy(_.isUndefined).omitBy(_.isNull).value()));
  },

  fromURIComponent: function (str) {
    return JSON.parse(lzString.decompressFromEncodedURIComponent(str) || '{}');
  }
};
