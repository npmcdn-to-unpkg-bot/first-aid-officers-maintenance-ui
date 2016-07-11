'use strict';

/* jshint camelcase: false */

var _ = require('lodash');
var moment = require('moment');
var pdfmake = require('pdfmake');
var filesaverjs = require('filesaverjs');
var XLSX = require('xlsx-browerify-shim');

var styles = {
  'title': { fontSize: 16, color: 'black' },
  'em': { color: 'black' },
  'table-header': { bold: true, fontSize: 13 },
  'link': { decoration: 'underline', color: '#337ab7' },
  'primary': { color: '#337ab7' },
  'success': { color: '#4caf50' },
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
    return (i === 1) ? styles['primary'].color : 'grey'; // jshint ignore: line
  },
  vLineColor: _.constant('grey')
};

var tableLayoutNoInnerLines = _.extend(_.clone(tableLayoutDefault), {
  hLineWidth: function (i) {
    return i === 1 ? 1 : 0;
  },
  hLineColor: _.constant(styles['primary'].color) // jshint ignore: line
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

function header(currentPage, pageCount, logo, title, subtitle, dateStr) {
  return {
    table: {
      widths: ['*', '*', '*'],
      body: [
        [
          { text: title, style: ['title', 'primary'] },
          { image: logo, alignment: 'center', fit: [160, 500], margin: [0, 0, 0, 0] },
          { text: [{ text: dateStr ? dateStr : moment().format('dddd Do MMMM YYYY'), style: 'primary' }, { text: '\n' + subtitle }], alignment: 'right' }
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

function createSheet(columns, data, createCell) {
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

  _.each(data, function (entry, r) {
    _.each(columns, function (col, c) {
      var value = _.get(entry, col.field);
      if (_.isNil(value)) {
        value = _.get(entry, col.sortable);
      }

      if (_.isNil(value)) {
        value = _.get(entry, col.id);
      }

      worksheet['!cols'][c].wch = Math.max(worksheet['!cols'][c].wch, _.size(value));
      worksheet[XLSX.utils.encode_cell({ c: c, r: r + 1 })] = createCell(col, value);
    });
  });

  return worksheet;
}

module.exports = {
  center: center,
  header: header,
  footer: footer,
  styles: styles,
  layouts: {
    default: tableLayoutDefault,
    primary: tableLayoutNoInnerLines,
    primaryCustom: function (rows) {
      return _.extend(_.clone(tableLayoutNoInnerLines), {
        hLineWidth: function (i) {
          return i === rows ? 1 : 0;
        }
      });
    }
  },
  createSheet: createSheet,
  generatePDF: function (docProperties, content) {
    return pdfmake.createPdf(_.extend({
      styles: styles,
      defaultStyle: { color: 'grey' },
      header: header,
      footer: footer,
      pageMargins: [40, 90, 40, 60],
      content: content
    }, docProperties));
  },
  generateXLSX: function (sheet) {
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
        Sheets: { 'Page 1': sheet }
      }, {
        bookType: 'xlsx',
        bookSST: false,
        type: 'binary'
      }))], { type: '' }))
    };
  }
};
