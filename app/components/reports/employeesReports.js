'use strict';

/* jshint camelcase: false */

var _ = require('lodash');
var moment = require('moment');
var reportsHelper = require('../../reportsHelper.js');

function filtersSection(conditions, filters) {
  return {
    table: {
      widths: ['*', '*'],
      body: [
        [{ colSpan: 2, style: 'primary', alignment: 'center', text: _.unescape('Ce document pr&eacute;sente les agents dont') }, {}]
      ].concat(_.map(_.values(filters).concat(_.map(conditions, function (condition) {
        switch (condition.params.condition.value) {
          case 'recent':
            return {
              title: 'Aptitude ' + condition.cert.cert_short,
              value: 'il y a moins de ' + condition.params.data + ' mois',
              link: 'a ' + _.unescape((condition.params.option.value === 'success' ? 'été obtenue/renouvelée' : 'expirée'))
            };
          case 'expiring':
            return { title: 'Aptitude ' + condition.cert.cert_short, value: condition.params.data + ' mois', link: 'expire sous' };
          case 'expiry':
            return {
              title: 'Aptitude ' + condition.cert.cert_short,
              value: 'le ' + moment(condition.params.data.from).format('Do MMMM YYYY') + ' et le ' + moment(condition.params.data.to).format('Do MMMM YYYY'),
              link: 'expire entre'
            };
          case 'status':
            return {
              title: 'Aptitude ' + condition.cert.cert_short,
              value: condition.params.option.display.toLowerCase(),
              link: condition.params.option.value === 'any' ? 'a été' : 'est'
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
      widths: _.map(columns, _.constant('auto')),
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
    var content = [reportsHelper.center(coreSection(_.reject(_.filter(columns, 'show'), { id: 'button' }), data))];
    if (_.keys(filters).length || conditions.length) {
      content.splice(0, 0, reportsHelper.center(filtersSection(conditions, filters)));
    }

    return reportsHelper.generatePDF({
      info: metadata,
      pageSize: format.format,
      pageOrientation: format.orientation,
      header: _.partialRight(reportsHelper.header, 'Extraction des Agents', '')
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
