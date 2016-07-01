'use strict';
/*jshint camelcase: false*/

var _ = require('lodash');
var moment = require('moment');
var lzString = require('lz-string');

var recentOptions = [{
  value: 'success',
  display: 'Obtenue'
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
  value: 'any',
  display: 'Obtenue - indépendamment de son statut actuel'
}];

var certificatesConditions = [{
  value: 'status',
  display: 'Selon statut actuel'
}, {
  value: 'recent',
  display: 'Récemment expirée/obtenue'
}, {
  value: 'obtained',
  display: 'Obtenue sur une certaine période'
}, {
  value: 'expiring',
  display: 'Expirant prochainement'
}, {
  value: 'expiry',
  display: 'Expirant sur une certaine période'
}];

function getConditionDisplay(cert, params) {
  switch (params.condition.value) {
    case 'status':
      return cert.cert_short + (params.option.value === 'any' ? ' a été ' : ' est ') + params.option.display.toLowerCase();
    case 'recent':
      return cert.cert_short + ' a ' + (params.option.value === 'success' ? 'été obtenue/renouvelée' : 'expirée') + ' il y a moins de ' + params.data + ' mois';
    case 'obtained':
      return cert.cert_short + ' a été obtenue/renouvelée entre le ' + moment(params.data.from).format('DD/MM/YYYY') + ' et le ' + moment(params.data.to).format('DD/MM/YYYY');
    case 'expiring':
      return cert.cert_short + ' expire sous ' + params.data + ' mois';
    case 'expiry':
      return cert.cert_short + ' expire entre le ' + moment(params.data.from).format('DD/MM/YYYY') + ' et le ' + moment(params.data.to).format('DD/MM/YYYY');
  }
}

module.exports = {
  recentOptions: recentOptions,
  statusOptions: statusOptions,
  certificatesConditions: certificatesConditions,
  getConditionDisplay: getConditionDisplay,
  isValid: function (params) {
    var res = true;
    if (!params.condition) {
      return false;
    }

    if (params.condition.value !== 'expiring' && params.condition.value !== 'obtained' && params.condition.value !== 'expiry') {
      res = params.option !== undefined;
    }

    if (params.condition.value !== 'status') {
      res = res && params.data !== undefined && params.data !== null;
    }

    if (params.condition.value === 'obtained' || params.condition.value === 'expiry') {
      res = res && params.data && params.data.from;
      res = res && params.data.to && !isNaN(params.data.from.getTime()) && !isNaN(params.data.to.getTime());
    }

    return res;
  },
  testCondition: function (certStats, params) {
    switch (params.condition.value) {
      case 'recent':
        if (!certStats) {
          return false;
        }

        var xMonthsAgo = moment(new Date()).subtract(params.data, 'months');
        if (params.option.value === 'danger') {
          return moment(certStats.expiryDate).isBetween(xMonthsAgo, new Date());
        }

        return _.some(certStats.trainings, function (trng) {
          return trng.trem_outcome === 'VALIDATED' && moment(trng.trng_date).isBetween(xMonthsAgo, new Date());
        });
      case 'obtained':
        if (!certStats) {
          return false;
        }

        return _.some(certStats.trainings, function (trng) {
          return trng.trem_outcome === 'VALIDATED' && moment(trng.trng_date).isBetween(params.data.from, params.data.to, null, '[]');
        });
      case 'expiring':
        if (!certStats) {
          return false;
        }

        var inXMonths = moment(new Date()).add(params.data, 'months');
        return moment(certStats.expiryDate).isBetween(new Date(), inXMonths);
      case 'expiry':
        if (!certStats) {
          return false;
        }

        return moment(certStats.expiryDate).isBetween(params.data.from, params.data.to, null, '[]');
      case 'status':
        if (!certStats) {
          return false;
        }

        if (params.option.value === 'success') {
          return certStats.validityStatus === 'warning' || certStats.validityStatus === 'success';
        }

        return params.option.value === 'any' || params.option.value === certStats.validityStatus;
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
        option: condition.c === 'recent' ? _(recentOptions).find({ value: condition.o }) : _(statusOptions).find({ value: condition.o }),
        data: condition.d
      };

      return {
        params: params,
        display: getConditionDisplay(certificates[condition.cert], params),
        cert: certificates[condition.cert]
      };
    });
  },
  toURIComponent: function (arr) {
    return lzString.compressToEncodedURIComponent(JSON.stringify(arr));
  },
  fromURIComponent: function (str) {
    return JSON.parse(lzString.decompressFromEncodedURIComponent(str) || '[]');
  }
};
