'use strict';

/* jshint camelcase: false */

var _ = require('lodash');
var moment = require('moment');
var pdfMake = require('pdfmake');
var filesaverjs = require('filesaverjs');
var XLSX = require('xlsx-browerify-shim');
var imgs64 = require('../../img/imgs64.js');

var styles = {
  'title': { fontSize: 16, color: 'black' },
  'em': { color: 'black' },
  'table-header': { bold: true, fontSize: 13 },
  'link': { decoration: 'underline', color: 'black' },
  'primary': { color: '#337ab7' },
  'success': { color: 'green' },
  'danger': { color: '#e51c23' },
  'warning': { color: '#ff9800' },
  'line-odd': { fillColor: '#f0f0f0' }
};

var tableLayoutDefault = {
  hLineWidth: function (i, node) {
    return i === 0 || i === node.table.body.length ? 0 : 1;
  },
  vLineWidth: _.constant(0),
  hLineColor: function (i) {
    return (i === 1) ? styles['primary'].color : 'grey'; // jshint ignore:line
  },
  vLineColor: _.constant('grey')
};

var tableLayoutNoInnerLines = _.extend(_.clone(tableLayoutDefault), {
  hLineWidth: function (i) {
    return i === 1 ? 1 : 0;
  }
});

function center(content) {
  if (_.isArray(content)) {
    return {
      columns: _.flattenDeep([{ width: '*', text: '' }, _.map(content, function (entry) {
        return [_.extend({ width: 'auto' }, entry), { width: '*', text: '' }];
      })])
    };
  }

  return { columns: [{ width: '*', text: '' }, _.extend({ width: 'auto' }, content), { width: '*', text: '' }] };
}

function header(currentPage, pageCount, title, subtitle) {
  return {
    table: {
      widths: ['*', '*', '*'],
      body: [
        [
          { text: title, style: ['title', 'primary'] },
          { image: imgs64.logo, alignment: 'center', width: 150, margin: [0, -10, 0, 0] },
          { text: [{ text: moment().format('dddd Do MMMM YYYY'), style: 'primary' }, { text: '\n' + subtitle }], alignment: 'right' }
        ]
      ]
    },
    layout: 'noBorders',
    margin: [30, 20]
  };
}

function footer(currentPage, pageCount, url) {
  return {
    columns: [{
      width: '*',
      text: url ? ['Consulter en ligne : ', { text: url, link: url, style: 'link' }] : ''
    }, {
      width: 'auto',
      text: ['page ', { text: currentPage.toString(), style: 'em' }, ' sur ', { text: pageCount.toString(), style: 'em' }],
      alignment: 'right'
    }],
    margin: [20, 20, 20, 0]
  };
}

function filtersSection(conditions, filters) {
  return {
    table: {
      widths: ['*', '*'],
      body: [
        [{ colSpan: 2, style: 'primary', alignment: 'center', text: _.unescape('Ce document pr&eacute;sente les sites dont') }, {}]
      ].concat(_.map(_.values(filters).concat(_.map(conditions, function (condition) {
        switch (condition.params.condition.value) {
          case 'number':
            return { title: 'Nombre d\'agents ' + condition.cert.cert_short, value: condition.params.option.display + ' ' + condition.params.data, link: 'est' };
          case 'percent':
            return { title: 'Taux de ' + condition.cert.cert_short, value: condition.params.option.display + ' ' + condition.params.data + '%', link: 'est' };
          case 'target':
            return { title: 'Cible ' + condition.cert.cert_short, value: condition.params.option.display.toLowerCase(), link: 'est' };
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
    layout: tableLayoutNoInnerLines,
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
    layout: tableLayoutNoInnerLines
  };
}

function createSheet(columns, data) {
  /* jshint camelcase: false */
  var worksheet = {
    '!ref': XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: columns.length - 1, r: data.length } }),
    '!cols': _.map(columns, function (col) {
      return {
        wch: _.unescape(col.title).length
      };
    })
  };
  _.each(columns, function (col, c) {
    worksheet[XLSX.utils.encode_cell({ c: c, r: 0 })] = { v: _.unescape(col.title), t: 's' };
  });

  _.each(data, function (site, r) {
    _.each(columns, function (col, c) {
      worksheet[XLSX.utils.encode_cell({ c: c, r: r + 1 })] = (function (value) {
        switch (col.id) {
          case 'cert':
            return { v: (value || 0) / 100, t: 'n', z: '0%' };
          default:
            worksheet['!cols'][c].wch = Math.max(worksheet['!cols'][c].wch, _.size(value));
            return { v: value, t: _.isNumber(value) ? 'n' : 's' };
        }
      })(_.get(site, col.field) || _.get(site, col.sortable) || _.get(site, col.id));
    });
  });

  return worksheet;
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
    layout: _.extend(_.clone(tableLayoutNoInnerLines), {
      hLineWidth: function (i) {
        return i === 2 ? 1 : 0;
      },
      hLineColor: _.constant(styles['primary'].color) // jshint ignore: line
    }),
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
    layout: _.extend(_.clone(tableLayoutNoInnerLines), {
      hLineWidth: function (i) {
        return i === 2 ? 1 : 0;
      },
      hLineColor: _.constant(styles['primary'].color) // jshint ignore: line
    })
  };

}

function generateDashboard(format, metadata, url, site, employees, columns, certificates) {
  var content = [center(dashboard(site, columns, certificates))];
  content.push(center(_.map(_.filter(certificates, 'checked'), _.partial(employeesList, employees))));

  return pdfMake.createPdf({
    info: metadata,
    pageSize: format.format,
    pageOrientation: format.orientation,
    pageMargins: [40, 90, 40, 60],
    header: _.partialRight(header, site.site_name, 'Tableau de bord'),
    footer: _.partialRight(footer, url),
    styles: styles,
    defaultStyle: {
      color: 'grey'
    },
    content: content
  });
}

function generateXLSX(columns, data) {
  return {
    download: _.partial(filesaverjs.saveAs, new Blob([(function (s) {
      /*jslint bitwise: true */
      var buf = new ArrayBuffer(s.length);
      var view = new Uint8Array(buf);
      for (var i = 0; i !== s.length; ++i) {
        view[i] = s.charCodeAt(i) & 0xFF;
      }

      return buf;
    })(XLSX.write({
      SheetNames: ['Page 1'],
      Sheets: { 'Page 1': createSheet(columns, data) }
    }, {
      bookType: 'xlsx',
      bookSST: false,
      type: 'binary'
    }))], { type: '' }))
  };
}

function generatePDF(format, metadata, conditions, filters, columns, data) {
  var content = [center(coreSection(_.reject(_.filter(columns, 'show'), { id: 'button' }), data))];
  if (_.keys(filters).length || conditions.length) {
    content.splice(0, 0, center(filtersSection(conditions, filters)));
  }

  return pdfMake.createPdf({
    info: metadata,
    pageSize: format.format,
    pageOrientation: format.orientation,
    pageMargins: [40, 90, 40, 60],
    header: _.partialRight(header, 'Extraction des Sites', ''),
    footer: footer,
    styles: styles,
    defaultStyle: {
      color: 'grey'
    },
    content: content
  });
}

module.exports = {
  generateDashboard: generateDashboard,
  generatePDF: generatePDF,
  generateXLSX: generateXLSX
};
