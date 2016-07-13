'use strict';

/* jshint camelcase: false */

var _ = require('lodash');
var reportsHelper = require('./reportsHelper.js');
var moment = require('moment');

function filtersSection(conditions, filters) {
  return {
    table: {
      widths: ['*', '*'],
      body: [
        [{ colSpan: 2, style: 'primary', alignment: 'center', text: _.unescape('Ce document pr&eacute;sente les sites dont') }, {}]
      ].concat(_.map(_.values(filters).concat(_.map(conditions, function (condition) {
        var cert = condition.cert.cert_short;
        switch (condition.params.condition.value) {
          case 'number':
            return { title: 'Nombre d\'agents ' + cert, value: condition.params.option.display + ' ' + condition.params.data, link: 'est' };
          case 'percent':
            return { title: 'Taux d\'agents ' + cert, value: condition.params.option.display + ' ' + condition.params.data + '%', link: 'est' };
          case 'target-success':
            return { title: 'Cible ' + cert, value: 'atteinte', link: 'est' };
          case 'target-warning':
            return { title: 'Cible ' + cert, value: 'presque atteinte', link: 'est' };
          case 'target-danger':
            return { title: 'Cible ' + cert, value: 'pas atteinte', link: 'n\'est' };
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
          case 'site_name':
          case 'dept':
            return '*';
          default:
            return 'auto';
        }
      }),
      body: [
        _.map(columns, function (col) {
          return { style: 'primary', alignment: 'center', text: _.unescape(col.title) };
        })
      ].concat(_.map(data, function (site, idx) {
        return columns.map(function (col) {
          return {
            alignment: (function (type) {
              switch (type) {
                case 'count':
                case 'remaining':
                case 'target':
                case 'cert':
                  return 'center';
                default:
                  return 'left';
              }
            }(col.id)),
            style: [idx % 2 ? 'line-odd' : '', (function (type) {
              switch (type) {
                case 'site_name':
                  return 'em';
                case 'count':
                case 'remaining':
                case 'cert':
                  return site.stats.certificates[col.cert_pk].targetStatus;
                default:
                  return '';
              }
            }(col.id))],
            text: (function (col) {
              switch (col.id) {
                case 'count':
                  return site.stats.certificates[col.cert_pk].count.toString();
                case 'remaining':
                  return site.stats.certificates[col.cert_pk].remaining.toString();
                case 'target':
                  return site.stats.certificates[col.cert_pk].target.toString();
                case 'cert':
                  return site.stats.certificates[col.cert_pk].countPercentage.toString() + '%';
                default:
                  return _.get(site, col.field || col.id) || '';
              }
            }(col))
          };
        });
      }))
    },
    layout: reportsHelper.layouts.primary
  };
}

function dashboard(site, columns, certificates) {
  return {
    table: {
      body: [
        [{ text: 'Vue d\'ensemble', colSpan: 4, alignment: 'center', style: ['table-header', 'primary'] }, {}, {}, {}],
        [
          { text: 'Aptitude', colSpan: 2, alignment: 'center', style: 'primary' },
          {},
          { text: 'Agents formés', style: 'primary' },
          { text: 'Cible', alignment: 'right', style: 'primary' }
        ]
      ].concat(_.filter(columns, { id: 'cert', show: true }).map(function (col, idx) {
        var certStats = site.stats.certificates[col.cert_pk],
          cert = certificates[col.cert_pk];
        return [
          { text: cert.cert_short, style: [idx % 2 ? 'line-odd' : '', certStats.targetStatus], alignment: 'right' },
          { text: cert.cert_name, style: [idx % 2 ? 'line-odd' : '', certStats.targetStatus], },
          { text: certStats.count + ' (' + certStats.countPercentage + '%)', style: [idx % 2 ? 'line-odd' : '', certStats.targetStatus], alignment: 'center' },
          { text: certStats.target + ' (' + cert.cert_target + '%)', style: idx % 2 ? 'line-odd' : '', alignment: 'right' }
        ];
      }))
    },
    layout: reportsHelper.layouts.primaryCustom(2),
    margin: [0, 0, 0, 20]
  };
}

function employeesList(employees, cert) {
  return {
    table: {
      // headerRows BUGGED, won't work when more than one tables spread over several pages.
      // headerRows: 2,
      body: [
        [{ text: cert.cert_name, colSpan: 3, alignment: 'center', style: ['table-header', 'primary'] }, {}, {}],
        [
          { text: 'Nom', style: 'primary' },
          { text: 'Prénom', style: 'primary' },
          { text: cert.cert_short + ' à renouveler en', alignment: 'center', style: 'primary' }
        ]
      ].concat(_(employees).filter(function (empl) {
        return empl.stats.certificates[cert.cert_pk] && empl.stats.certificates[cert.cert_pk].valid;
      }).map(function (empl, idx) {
        var certStats = empl.stats.certificates[cert.cert_pk];
        return [
          { text: empl.empl_surname, style: ['em', idx % 2 ? 'line-odd' : ''] },
          { text: empl.empl_firstname, style: ['em', idx % 2 ? 'line-odd' : ''] },
          { text: moment(certStats.expiryDate).format('MMM YYYY'), alignment: 'right', style: [certStats.validityStatus, idx % 2 ? 'line-odd' : ''] }
        ];
      }).value())
    },
    layout: reportsHelper.layouts.primaryCustom(2)
  };
}

module.exports = {
  generateDashboard: function (format, metadata, site, employees, columns, certificates) {
    return reportsHelper.generatePDF({
      info: metadata,
      pageSize: format.format,
      pageOrientation: format.orientation,
      header: _.partialRight(reportsHelper.header, metadata.logo, site.site_name, 'Tableau de bord'),
      footer: _.partialRight(reportsHelper.footer, metadata.url, metadata.mailto),
    }, [
      reportsHelper.center(dashboard(site, columns, certificates)),
      reportsHelper.center(_.map(_.filter(certificates, 'checked'), _.partial(employeesList, employees)), true)
    ]);
  },
  generatePDF: function (format, metadata, conditions, filters, columns, data) {
    var content = [reportsHelper.center(coreSection(_.reject(_.filter(columns, 'show'), { id: 'button' }), data), true)];
    if (_.keys(filters).length || conditions.length) {
      content.splice(0, 0, reportsHelper.center(filtersSection(conditions, filters)));
    }

    return reportsHelper.generatePDF({
      info: metadata,
      pageSize: format.format,
      pageOrientation: format.orientation,
      header: _.partialRight(reportsHelper.header, metadata.logo, 'Extraction des Sites', ''),
      footer: _.partialRight(reportsHelper.footer, metadata.url, metadata.mailto)
    }, content);
  },
  generateXLSX: function (columns, data) {
    return reportsHelper.generateXLSX(reportsHelper.createSheet(columns, data, function (col, value) {
      switch (col.id) {
        case 'cert':
          return { v: (value || 0) / 100, t: 'n', z: '0%' };
        default:
          return { v: value, t: _.isNumber(value) ? 'n' : 's' };
      }
    }));
  }
};
