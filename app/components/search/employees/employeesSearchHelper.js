'use strict';
/*jshint camelcase: false*/

var _ = require('lodash');
var moment = require('moment');
var lzString = require('lz-string');

var recentOptions = [{
  value: 'success',
  display: 'Obenue'
}, {
  value: 'danger',
  display: 'Expirée'
}];

var statusOptions = [{
  value: 'success',
  display: 'Valide'
}, {
  value: 'warning',
  display: 'À renouveler sous six mois'
}, {
  value: 'danger',
  display: 'Expirée'
}, {
  value: 'blank',
  display: 'Jamais obtenue'
}];

var certificatesConditions = [{
  value: 'recent',
  display: 'Aptitude récemment expirée/obtenue'
}, {
  value: 'expiring',
  display: 'Expire prochainement'
}, {
  value: 'expiry',
  display: 'Expire sur une certaine période'
}, {
  value: 'status',
  display: 'Statut de l\'aptitude'
}];

function getConditionDisplay(cert, params) {
  switch (params.condition.value) {
    case 'recent':
      return cert.cert_short + ' ' + params.option.display.toLowerCase() + ' il y a moins de ' + params.data + ' mois';
    case 'expiring':
      return cert.cert_short + ' expirant sous ' + params.data + ' mois';
    case 'expiry':
      return cert.cert_short + ' expirant entre le ' + moment(params.data.from).format('Do MMMM YYYY') + ' et le ' + moment(params.data.to).format('Do MMMM YYYY');
    case 'status':
      return cert.cert_short + ' ' + params.option.display.toLowerCase();
  }
}

module.exports = {
  recentOptions: recentOptions,
  statusOptions: statusOptions,
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
            o: condition.params.option ? condition.params.option.value : undefined,
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
              option: condition.c === 'recent' ? _(recentOptions).find({ value: condition.o }) : _(statusOptions).find({ value: condition.o }),
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
    return JSON.parse(lzString.decompressFromEncodedURIComponent(str) || '{}');
  }
};