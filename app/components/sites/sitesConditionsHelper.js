'use strict';
/*jshint camelcase: false*/

var _ = require('lodash');
var lzString = require('lz-string');

var comparisonOptions = [{
  value: 'le',
  short: '≤',
  display: 'inférieur à'
}, {
  value: 'eq',
  short: '=',
  display: 'égal à'
}, {
  value: 'ge',
  short: '≥',
  display: 'supérieur à'
}];

var certificatesConditions = [{
  value: 'target-success',
  display: 'Atteinte',
  group: 'Cible'
}, {
  value: 'target-warning',
  display: 'Presque atteinte',
  group: 'Cible'
}, {
  value: 'target-danger',
  display: 'Non atteinte',
  group: 'Cible'
}, {
  value: 'percent',
  display: 'Taux',
  group: 'Agents formés'
}, {
  value: 'number',
  display: 'Nombre',
  group: 'Agents formés'
}];

function getConditionDisplay(cert, params) {
  switch (params.condition.value) {
    case 'number':
      return 'Nombre d\'agents ' + cert.cert_short + ' ' + params.option.short + ' ' + params.data;
    case 'percent':
      return 'Taux d\'agents' + cert.cert_short + ' ' + params.option.short + ' ' + params.data + '%';
    case 'target-success':
      return 'Cible ' + cert.cert_short + ' est atteinte';
    case 'target-warning':
      return 'Cible ' + cert.cert_short + ' est presque atteinte';
    case 'target-danger':
      return 'Cible ' + cert.cert_short + ' n\'est pas atteinte';
  }
}

function testComparison(value, params) {
  if (params) {
    switch (params.option.value) {
      case 'le':
        return value <= params.data;
      case 'eq':
        return value === params.data;
      case 'ge':
        return value >= params.data;
    }
  }

  return true;
}

module.exports = {
  comparisonOptions: comparisonOptions,
  certificatesConditions: certificatesConditions,
  getConditionDisplay: getConditionDisplay,

  isValid: function (params) {
    if (!params || !params.condition) {
      return false;
    }

    if (params.condition.value === 'number' || params.condition.value === 'percent') {
      return params.option && _.isNumber(params.data);
    }

    return true;
  },

  testCondition: function (certStats, params) {
    switch (params.condition.value) {
      case 'number':
        return testComparison(certStats.count, params);
      case 'percent':
        return testComparison(certStats.countPercentage, params);
      case 'target-success':
        return certStats.targetStatus === 'success';
      case 'target-warning':
        return certStats.targetStatus === 'warning';
      case 'target-danger':
        return certStats.targetStatus !== 'success';
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
        option: _(comparisonOptions).find({ value: condition.o }),
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
