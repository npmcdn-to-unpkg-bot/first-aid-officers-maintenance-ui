'use strict';

/* jshint camelcase: false */

var _ = require('lodash');
var moment = require('moment');
var reportsHelper = require('./reportsHelper.js');

function filtersSection(conditions, filters) {
  return {
    table: {
      widths: ['*', '*'],
      body: [
        [{ colSpan: 2, style: 'primary', alignment: 'center', text: _.unescape('Ce document pr&eacute;sente les agents dont') }, {}]
      ].concat(_.map(_.values(filters).concat(_.map(conditions, function (condition) {
        var cert = condition.cert.cert_short;
        var data = condition.params.data;
        switch (condition.params.condition.value) {
          case 'status-success':
            return { title: 'Aptitude ' + cert, value: 'valide', link: 'est actuellement' };
          case 'status-danger':
            return { title: 'Aptitude ' + cert, value: 'expirée', link: 'est actuellement' };
          case 'status-any':
            return { title: 'Dispositif ' + cert, value: 'intégré', link: 'a été' };
          case 'status-blank':
            return { title: 'Dispositif ' + cert, value: 'jamais été intégré', link: 'n\'a' };
          case 'obtained-recent':
            return { title: 'Aptitude ' + cert, value: 'il y a moins de ' + data + ' mois', link: 'a été obtenue/renouvelée' };
          case 'expiring-recent':
            return { title: 'Aptitude ' + cert, value: 'il y a moins de ' + data + ' mois', link: 'a expiré' };
          case 'expiring-soon':
            return { title: 'Aptitude ' + cert, value: 'dans moins de ' + data + ' mois', link: 'expire' };
          case 'obtained-period':
            return {
              title: 'Aptitude ' + cert,
              value: 'entre le ' + moment(data.from).format('DD/MM/YYYY') + ' et le ' + moment(data.to).format(
                'DD/MM/YYYY'),
              link: 'a été obtenue/renouvelée'
            };
          case 'expiring-period':
            return {
              title: 'Aptitude ' + cert,
              value: 'entre le ' + moment(data.from).format('DD/MM/YYYY') + ' et le ' + moment(data.to).format(
                'DD/MM/YYYY'),
              link: 'expire'
            };
        }
      })), function (filter, idx) {
        return [{
          colSpan: 2,
          style: idx % 2 ? 'line-odd' : '',
          alignment: 'center',
          text: [
            { style: 'em', text: _.unescape(filter.title) },
            { text: ' ' + (filter.link || 'contient') + ' ' },
            { style: 'em', text: _.unescape(filter.value) }
          ]
        }, {}];
      }))
    },
    layout: reportsHelper.layouts.primary,
    margin: [0, 0, 0, 20]
  };
}

function coreSection(columns, data) {
  return {
    table: {
      widths: _.map(columns, function (col) {
        switch (col.id) {
          case 'empl_firstname':
          case 'empl_surname':
          case 'site.site_name':
            return '*';
          default:
            return 'auto';
        }
      }),
      body: [
        _.map(columns, function (col) {
          return { style: 'primary', alignment: 'center', text: _.unescape(col.title) };
        })
      ].concat(_.map(data, function (empl, idx) {
        return columns.map(function (col) {
          return {
            alignment: (function (type) {
              switch (type) {
                case 'empl_gender':
                  return 'right';
                case 'cert':
                case 'empl_permanent':
                  return 'center';
                default:
                  return 'left';
              }
            }(col.id)),
            style: [idx % 2 ? 'line-odd' : '', (function (type) {
              switch (type) {
                case 'empl_gender':
                case 'empl_firstname':
                case 'empl_surname':
                  return 'em';
                case 'empl_permanent':
                  return empl.empl_permanent ? 'success' : 'warning';
                case 'cert':
                  var certStats = empl.stats.certificates[col.cert_pk];
                  return certStats ? certStats.validityStatus : '';
                default:
                  return '';
              }
            }(col.id))],
            text: (function (col) {
              switch (col.id) {
                case 'empl_gender':
                  return empl.empl_gender ? 'M.' : 'Mme';
                case 'empl_permanent':
                  return empl.empl_permanent ? 'CDI' : 'CDD';
                case 'cert':
                  var certStats = empl.stats.certificates[col.cert_pk];
                  return certStats ? moment(certStats.expiryDate).format('MMM YYYY') : '';
                default:
                  return _.get(empl, col.field || col.id) || '';
              }
            }(col))
          };
        });
      }))
    },
    layout: reportsHelper.layouts.primary,
  };
}

module.exports = {
  generatePDF: function (format, metadata, conditions, filters, columns, data) {
    var content = [reportsHelper.center(coreSection(_.reject(_.filter(columns, 'show'), { id: 'button' }), data), true)];
    if (_.keys(filters).length || conditions.length) {
      content.splice(0, 0, reportsHelper.center(filtersSection(conditions, filters)));
    }

    return reportsHelper.generatePDF({
      info: metadata,
      pageSize: format.format,
      pageOrientation: format.orientation,
      header: _.partialRight(reportsHelper.header, metadata.logo, 'Extraction des Agents', ''),
      footer: _.partialRight(reportsHelper.footer, metadata.url, metadata.mailto)
    }, content);
  },
  generateXLSX: function (columns, data) {
    return reportsHelper.generateXLSX(reportsHelper.createSheet(columns, data, function (col, value) {
      switch (col.id) {
        case 'cert':
          return { v: value, t: 'd' };
        case 'empl_gender':
          return { v: value ? 'Masculin' : _.unescape('F&eacute;minin'), t: 's' };
        case 'empl_permanent':
          return { v: value ? 'CDI' : 'CDD', t: 's' };
        default:
          return { v: value, t: _.isNumber(value) ? 'n' : 's' };
      }
    }));
  }
};
