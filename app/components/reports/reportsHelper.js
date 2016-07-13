'use strict';

/* jshint camelcase: false */

var _ = require('lodash');
var moment = require('moment');
var pdfmake = require('pdfmake');
var filesaverjs = require('filesaverjs');
var XLSX = require('xlsx-browerify-shim');

var logo64;
(function (src, callback, outputFormat) {
  var img = new Image();
  // Add CORS approval to prevent a tainted canvas
  img.crossOrigin = 'Anonymous';
  img.onload = function () {
    var canvas = document.createElement('CANVAS');
    var ctx = canvas.getContext('2d');
    var dataURL;
    // Resize the canavas to the image dimensions
    canvas.height = this.height;
    canvas.width = this.width;
    ctx.drawImage(this, 0, 0);
    dataURL = canvas.toDataURL(outputFormat);
    callback(dataURL);
    // Mark for garbage collection
    canvas = null;
  };

  img.src = src;
  // make sure the load event fires for cached images too
  if (img.complete || img.complete === undefined) {
    // Flush cache
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
    img.src = src;
  }
})('../img/logo_complete.png', function (data) {
  logo64 = data;
});

var styles = {
  'title': { fontSize: 14, color: 'black' },
  'em': { color: 'black' },
  'table-header': { fontSize: 12 },
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

function center(content, fill) {
  if (_.isArray(content)) {
    return {
      columns: _.flattenDeep([{ width: '*', text: '' }, _.map(content, function (entry) {
        return [_.extend({ width: 'auto' }, entry), { width: '*', text: '' }];
      })])
    };
  }

  return { columns: [{ width: fill ? 'auto' : '*', text: '' }, _.extend({ width: fill ? '*' : 'auto' }, content), { width: fill ? 'auto' : '*', text: '' }] };
}

function header(currentPage, pageCount, logo, title, subtitle, dateStr) {
  return {
    table: {
      widths: ['*', '*', '*'],
      body: [
        [
          { text: title, style: ['title', 'primary'] },
          { image: logo, alignment: 'center', fit: [120, 60], margin: [-15, 0, 0, 0] },
          { text: [{ text: dateStr ? dateStr : moment().format('dddd Do MMMM YYYY'), style: ['title', 'primary'] }, { text: '\n' + subtitle }], alignment: 'right' }
        ]
      ]
    },
    layout: 'noBorders',
    margin: [20, 15, 20, 10]
  };
}

function footer(currentPage, pageCount, url, mailto) {
  return [{
    table: {
      widths: ['*', '*', 'auto', '*', '*'],
      body: [
        [
          { text: '', rowSpan: 2 },
          { text: '', margin: [0, 5, 0, 0] },
          { image: logo64, fit: [70, 50], rowSpan: 2, margin: [10, 0, 10, 0] },
          { text: '' },
          { text: '', rowSpan: 2 }
        ],
        ['', '', {}, '', '']
      ]
    },
    layout: {
      hLineWidth: function (i) {
        return i === 1 ? 1 : 0;
      },
      vLineWidth: _.constant(0),
      hLineColor: _.constant('lightgrey') // jshint ignore: line
    },
    margin: [10, 10, 10, 10]
  }, {
    columns: [{
      width: 'auto',
      text: url ? [{ text: 'Consulter en ligne', link: url, style: 'link' }] : ''
    }, {
      width: '*',
      text: mailto ? [
        'Adresser modifications à ',
        { text: mailto, link: mailto, style: 'link' }
      ] : '',
      alignment: 'center'
    }, {
      width: 'auto',
      text: ['page ', { text: currentPage.toString(), style: 'em' }, ' sur ', { text: pageCount.toString(), style: 'em' }],
      alignment: 'right'
    }],
    margin: [20, 0, 20, 0]
  }];
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
      defaultStyle: { color: 'grey', fontSize: 10 },
      header: header,
      footer: footer,
      pageMargins: [20, 80, 20, 75],
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
