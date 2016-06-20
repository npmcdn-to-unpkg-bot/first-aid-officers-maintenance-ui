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
            case 'cert':
              return 'DD/MM/YYYY'.length;
            case 'empl_gender':
              return 'Masculin'.length;
            case 'empl_permanent':
              return 'CDD'.length;
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
          case 'cert':
            return { v: value, t: 'd' };
          case 'empl_gender':
            return { v: value ? 'Masculin' : _.unescape('F&eacute;minin'), t: 's' };
          case 'empl_permanent':
            return { v: value ? 'CDI' : 'CDD', t: 's' };
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
    header: _.partialRight(header, 'Extraction des Agents', ''),
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
