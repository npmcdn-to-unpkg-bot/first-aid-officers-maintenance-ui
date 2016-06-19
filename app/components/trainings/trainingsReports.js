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
  return { columns: [{ width: '*', text: '' }, _.extend({ width: 'auto' }, content), { width: '*', text: '' }, ] };
}

function header() {
  return {
    table: {
      widths: ['*', '*', '*'],
      body: [
        [
          { text: 'Extraction des Formations', style: ['title', 'primary'] },
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

function filterRow(filter, idx) {
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
}

function filtersSection(datesCondition, filters, types) {
  var firstChunk = datesCondition ? [
    [{ colSpan: 2, style: 'primary', alignment: 'center', text: _.unescape('Ce document pr&eacute;sente les formations qui ont &eacute;t&eacute; / seront') }, {}]
  ].concat([filterRow((function (datesCondition) {
    switch (datesCondition.option) {
      case 'soon':
        return { title: 'Prévues', value: datesCondition.data + ' prochains mois', link: 'dans les' };
      case 'recent':
        return { title: 'Prévue/réalisées', value: 'moins de ' + datesCondition.data + ' mois', link: 'il y a' };
      case 'specific':
        return {
          title: 'Prévue/réalisées',
          value: 'le ' + moment(datesCondition.from).format('DD/MM/YYYY') + ' et le ' + moment(datesCondition.from).format('DD/MM/YYYY'),
          link: 'entre'
        };
    }
  })(datesCondition))]) : [];

  var secondChunk = types.length ? [
    [{
      colSpan: 2,
      margin: [0, datesCondition ? 10 : 0, 0, 0],
      style: 'primary',
      alignment: 'center',
      text: datesCondition ? 'Et dont le type' : _.unescape('Ce document pr&eacute;sente les formations dont le type')
    }, {}]
  ].concat(_.map(types, function (type, idx) {
    return [{ colSpan: 2, style: idx % 2 ? 'line-odd' : '', alignment: 'center', text: [{ text: idx ? 'ou bien ' : 'est ' }, { style: 'em', text: type.trty_name }] }, {}];
  })) : [];

  var thirdChunk = filters.length ? [
    [{
      colSpan: 2,
      margin: [0, datesCondition || types.length ? 10 : 0, 0, 0],
      style: 'primary',
      alignment: 'center',
      text: datesCondition || types.length ? 'Et dont' : _.unescape('Ce document pr&eacute;sente les formations dont')
    }, {}]
  ].concat(_.map(filters, filterRow)) : [];

  return {
    table: {
      widths: ['*', '*'],
      body: firstChunk.concat(secondChunk).concat(thirdChunk)
    },
    layout: _.extend(_.clone(tableLayoutNoInnerLines), {
      hLineWidth: function (i) {
        return _.includes([1, firstChunk.length + 1, firstChunk.length + secondChunk.length + 1], i) ? 1 : 0;
      },
      hLineColor: _.constant(styles['primary'].color) // jshint ignore: line
    }),
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
      ].concat(_.map(data, function (trng, idx) {
        return columns.map(function (col) {
          return {
            alignment: (function (type) {
              switch (type) {
                case 'registered':
                case 'validated':
                case 'flunked':
                case 'trng_outcome':
                  return 'center';
                default:
                  return 'left';
              }
            }(col.id)),
            style: [idx % 2 ? 'line-odd' : '', (function (type) {
              switch (type) {
                case 'validated':
                  return 'success';
                case 'flunked':
                  return 'danger';
                case 'dates':
                case 'trng_end':
                  return 'em';
                case 'trng_outcome':
                  return trng.trng_outcome === 'COMPLETED' ? 'success' : 'primary';
                default:
                  return '';
              }
            }(col.id))],
            text: (function (col) {
              switch (col.id) {
                case 'trng_outcome':
                  return _.unescape(trng.trng_outcome === 'COMPLETED' ? 'R&eacute;alis&eacute;e' : 'Pr&eacute;vue');
                case 'trng_start':
                case 'trng_end':
                  return trng[col.sortable] ? moment(trng[col.sortable]).format('DD/MM/YYYY') : '';
                case 'cert':
                  var certStats = trng.stats.certificates[col.cert_pk];
                  return certStats ? moment(certStats.expiryDate).format('MMM YYYY') : '';
                default:
                  return _.get(trng, col.field || col.id) + '';
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
        wch: (function (id) {
          switch (id) {
            case 'trng_outcome':
              return _.unescape('R&eacute;alis&eacute;e').length;
            default:
              return _.unescape(col.title).length;
          }
        })(col.id)
      };
    })
  };
  _.each(columns, function (col, c) {
    worksheet[XLSX.utils.encode_cell({ c: c, r: 0 })] = { v: _.unescape(col.title), t: 's' };
  });

  _.each(data, function (entry, r) {
    _.each(columns, function (col, c) {
      worksheet[XLSX.utils.encode_cell({ c: c, r: r + 1 })] = (function (value) {
        switch (col.id) {
          case 'registered':
          case 'validated':
          case 'flunked':
            return { v: value || 0, t: 'n' };
          case 'trng_start':
          case 'trng_end':
            return { v: value || undefined, t: 'd' };
          case 'trng_outcome':
            return { v: _.unescape(value === 'COMPLETED' ? 'R&eacute;alis&eacute;e' : 'Pr&eacute;vue'), t: 's' };
          default:
            worksheet['!cols'][c].wch = Math.max(worksheet['!cols'][c].wch, _.size(value));
            return { v: value, t: _.isNumber(value) ? 'n' : 's' };
        }
      })(_.get(entry, col.field) || _.get(entry, col.sortable) || _.get(entry, col.id));
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
      Sheets: { 'Page 1': createSheet(columns, data) },
      cellStyles: true
    }, {
      bookType: 'xlsx',
      bookSST: false,
      type: 'binary'
    }))], { type: '' }))
  };
}

function generatePDF(format, metadata, datesCondition, filters, types, columns, data) {
  var content = [center(coreSection(_(columns).filter('show').reject({ id: 'button' }).reject({ id: 'certs' }).value(), data))];
  if (datesCondition || types.length || _.keys(filters).length) {
    content.splice(0, 0, center(filtersSection(datesCondition, _.values(filters), types)));
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
