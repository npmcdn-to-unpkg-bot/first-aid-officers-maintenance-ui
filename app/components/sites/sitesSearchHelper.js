'use strict';
/*jshint camelcase: false*/

var _ = require('lodash');
var lzString = require('lz-string');

var comparisonOptions = [{
  value: 'lt',
  short: '<',
  display: 'inférieur à'
}, {
  value: 'le',
  short: '≤',
  display: 'inférieur ou égal à'
}, {
  value: 'eq',
  short: '=',
  display: 'égal à'
}, {
  value: 'ge',
  short: '≥',
  display: 'supérieur ou égal à'
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
  value: 'number',
  display: 'Nombre d\'agents formés'
}, {
  value: 'percent',
  display: 'Taux d\'agents formés'
}, {
  value: 'target',
  display: 'Par rapport à la cible'
}];

function getConditionDisplay(cert, params) {
  switch (params.condition.value) {
    case 'number':
      return 'Agents ' + cert.cert_short + ' ' + params.option.short + ' ' + params.data;
    case 'percent':
      return 'Taux ' + cert.cert_short + ' ' + params.option.short + ' ' + params.data + '%';
    case 'target':
      return 'Cible ' + cert.cert_short + ' ' + params.option.display.toLowerCase();
  }
}

module.exports = {
  comparisonOptions: comparisonOptions,
  targetOptions: targetOptions,
  certificatesConditions: certificatesConditions,
  getConditionDisplay: getConditionDisplay,

  stripDown: function (certificates) {
    return _(certificates).filter(function (cert) {
      return cert.conditions && cert.conditions.length > 0;
    }).map(function (cert) {
      return {
        pk: cert.cert_pk,
        c: _.map(cert.conditions, function (condition) {
          return {
            c: condition.params.condition.value,
            o: condition.params.option.value,
            d: condition.params.data
          };
        })
      };
    }).keyBy('pk').value();
  },

  fillUp: function (dest, src) {
    if (src) {
      return _.map(dest, function (cert) {
        var srcCert = src[cert.cert_pk];
        if (srcCert) {
          cert.conditions = _.map(srcCert.c, function (condition) {
            var params = {
              condition: _(certificatesConditions).find({ value: condition.c }),
              option: _(comparisonOptions).find({ value: condition.o }) || _(targetOptions).find({ value: condition.o }),
              data: condition.d
            };

            return {
              params: params,
              display: getConditionDisplay(cert, params)
            };
          });
        }

        return cert;
      });
    }

    return dest;
  },

  toURIComponent: function (obj) {
    return lzString.compressToEncodedURIComponent(JSON.stringify(_(obj).omitBy(_.isUndefined).omitBy(_.isNull).value()));
  },

  fromURIComponent: function (str) {
    return JSON.parse(lzString.decompressFromEncodedURIComponent(str));
  }
};
