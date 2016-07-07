'use strict';
/*jshint camelcase: false*/

var _ = require('lodash');
var moment = require('moment');
var lzString = require('lz-string');

var certificatesConditions = [{
  value: 'status-success',
  display: 'Valide',
  group: 'Statut actuel'
}, {
  value: 'status-danger',
  display: 'Expiré',
  group: 'Statut actuel'
}, {
  value: 'status-any',
  display: 'Intégré',
  group: 'Dispositif'
}, {
  value: 'status-blank',
  display: 'Jamais intégré',
  group: 'Dispositif'
}, {
  value: 'obtained-recent',
  display: 'Récemment',
  group: 'Aptitude obtenue/renouvelée'
}, {
  value: 'obtained-period',
  display: 'Sur une certaine période',
  group: 'Aptitude obtenue/renouvelée'
}, {
  value: 'expiring-recent',
  display: 'Récemment',
  group: 'Aptitude expirée/expirant'
}, {
  value: 'expiring-soon',
  display: 'Prochainement',
  group: 'Aptitude expirée/expirant'
}, {
  value: 'expiring-period',
  display: 'Sur une certaine période',
  group: 'Aptitude expirée/expirant'
}];

function getConditionDisplay(cert, params) {
  switch (params.condition.value) {
    case 'status-success':
      return 'Aptitude ' + cert.cert_short + ' est actuellement valide';
    case 'status-danger':
      return 'Aptitude ' + cert.cert_short + ' est actuellement expirée';
    case 'status-any':
      return 'Dispositif ' + cert.cert_short + ' a été intégré';
    case 'status-blank':
      return 'Dispositif ' + cert.cert_short + ' n\'a jamais été intégré';
    case 'obtained-recent':
      return 'Aptitude ' + cert.cert_short + ' a été obtenue/renouvelée il y a moins de ' + params.data + ' mois';
    case 'expiring-recent':
      return 'Aptitude ' + cert.cert_short + ' a expiré il y a moins de ' + params.data + ' mois';
    case 'expiring-soon':
      return 'Aptitude ' + cert.cert_short + ' expire dans moins de ' + params.data + ' mois';
    case 'obtained-period':
      return cert.cert_short + ' a été obtenue/renouvelée entre le ' + moment(params.data.from).format('DD/MM/YYYY') + ' et le ' + moment(params.data.to).format('DD/MM/YYYY');
    case 'expiring-period':
      return cert.cert_short + ' expire entre le ' + moment(params.data.from).format('DD/MM/YYYY') + ' et le ' + moment(params.data.to).format('DD/MM/YYYY');
  }
}

module.exports = {
  certificatesConditions: certificatesConditions,
  getConditionDisplay: getConditionDisplay,
  isValid: function (params) {
    if (!params.condition) {
      return false;
    }

    switch (params.condition.value) {
      case 'status-success':
      case 'status-danger':
      case 'status-any':
      case 'status-blank':
        return true;
      case 'obtained-recent':
      case 'expiring-recent':
      case 'expiring-soon':
        return params.data;
      case 'obtained-period':
      case 'expiring-period':
        return params.data && params.data.from && params.data.to && !isNaN(params.data.from.getTime()) && !isNaN(params.data.to.getTime());
    }
  },
  testCondition: function (certStats, params) {
    var from, to, incl;
    if (!certStats) {
      return params.condition.value === 'status-blank';
    }

    switch (params.condition.value) {
      case 'status-success':
        return certStats.validityStatus === 'warning' || certStats.validityStatus === 'success';
      case 'status-danger':
        return certStats.validityStatus === 'danger';
      case 'status-any':
        return true;
      case 'status-blank':
        return false;
      case 'obtained-recent':
        from = moment(to = new Date()).subtract(params.data, 'months');
        incl = '(]';
        /* falls through */
      case 'obtained-period':
        return _.some(certStats.trainings, function (trng) {
          return trng.trem_outcome === 'VALIDATED' && moment(trng.trng_date).isBetween(from || params.data.from, to || params.data.to, null, incl || '[]');
        });
      case 'expiring-recent':
        from = moment(to = new Date()).subtract(params.data, 'months');
        incl = '(]';
        /* falls through */
      case 'expiring-soon':
        to = moment(from = new Date()).add(params.data, 'months');
        incl = '[)';
        /* falls through */
      case 'expiring-period':
        return moment(certStats.expiryDate).isBetween(from || params.data.from, to || params.data.to, null, incl || '[]');
    }
  },
  stripDown: function (conditions) {
    return _.map(conditions, function (condition) {
      return {
        c: condition.params.condition.value,
        d: condition.params.data,
        cert: condition.cert.cert_pk
      };
    });
  },
  fillUp: function (conditions, certificates) {
    return _.map(conditions, function (condition) {
      var params = {
        condition: _(certificatesConditions).find({ value: condition.c }),
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
