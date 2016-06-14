'use strict';

/* jshint camelcase: false */

var _ = require('lodash');
var moment = require('moment');
var pdfMake = require('pdfmake');
var filesaverjs = require('filesaverjs');
var XLSX = require('xlsx-browerify-shim');
var imgs64 = require('../../img/imgs64.js');

function decodeHtml(html) {
  var txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

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
  return { columns: [{ width: '*', text: '' }, _.extend({ width: 'auto' }, content), { width: '*', text: '' }, ] };
}

function header() {
  return {
    table: {
      widths: ['*', '*', '*'],
      body: [
        [
          { text: 'Extraction des Sites', style: ['title', 'primary'] },
          { image: imgs64.logo, alignment: 'center', width: 150, margin: [0, -10, 0, 0] },
          { text: [{ text: moment().format('dddd Do MMMM YYYY'), style: 'primary' }, { text: '\nTableau de bord' }], alignment: 'right' }
        ]
      ]
    },
    layout: 'noBorders',
    margin: [30, 20]
  };
}

function footer(currentPage, pageCount) {
  return {
    columns: [{
      width: '*',
      text: ['', { text: '', link: '', style: 'link' }]
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
        [{ colSpan: 2, style: 'primary', alignment: 'center', text: decodeHtml('Ce document pr&eacute;sente les sites dont') }, {}]
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
            { style: 'em', text: decodeHtml(filter.title) },
            { text: ' ' + (filter.link || 'contient') + ' ' },
            { style: 'em', text: decodeHtml(filter.value) }
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
          return { style: 'primary', alignment: 'center', text: decodeHtml(col.title) };
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
  var worksheet = { '!ref': XLSX.utils.encode_range({ s: { c: 0, r: 0 }, e: { c: columns.length - 1, r: data.length - 1 } }) };
  _.each(columns, function (col, c) {
    worksheet[XLSX.utils.encode_cell({ c: c, r: 0 })] = { v: decodeHtml(col.title), t: 's' };
  });

  _.each(data, function (site, r) {
    _.each(columns, function (col, c) {
      worksheet[XLSX.utils.encode_cell({ c: c, r: r + 1 })] = (function (value) {
        switch (col.id) {
          case 'cert':
            return { v: (value || 0) / 100, t: 'n', z: '0%' };
          default:
            return { v: value, t: _.isNumber(value) ? 'n' : 's' };
        }
      })(_.get(site, col.field) || _.get(site, col.sortable) || _.get(site, col.id));
    });
  });

  return worksheet;
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
    header: header,
    footer: footer,
    styles: styles,
    defaultStyle: {
      color: 'grey'
    },
    content: content
  });
}

module.exports = {
  generatePDF: generatePDF,
  generateXLSX: generateXLSX
};
