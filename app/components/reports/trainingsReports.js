'use strict';

/* jshint camelcase: false */

var _ = require('lodash');
var moment = require('moment');
var reportsHelper = require('./reportsHelper.js');

function extraPadding(layout) {
  return _.extend(_.clone(layout), {
    paddingTop: function (i) {
      return i === 0 ? 4 : 10;
    },
    paddingBottom: function (i) {
      return i === 0 ? 4 : 10;
    },
    paddingLeft: function (i) {
      return i === 0 ? 4 : 6;
    },
    paddingRight: function (i, node) {
      return i === node.table.widths.length - 1 ? 4 : 6;
    }
  });
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
    layout: _.extend(_.clone(reportsHelper.layouts.primary), {
      hLineWidth: function (i) {
        return _.includes([1, firstChunk.length + 1, firstChunk.length + secondChunk.length + 1], i) ? 1 : 0;
      }
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
    layout: reportsHelper.layouts.primary
  };
}

function trainingOverview(trng, completed) {
  return {
    table: {
      widths: ['*', '*'],
      body: [
        [{
          text: ['Formateur(s) :\n'].concat(_.map(trng.trainers, function (trainer) {
            return { text: trainer.empl_surname + ' ' + trainer.empl_firstname + '\n', style: 'primary' };
          })),
        }, {
          table: {
            widths: ['*'],
            body: [
              [{ text: 'Signature du/des formateur(s)', alignment: 'center', margin: [0, 0, 0, 50] }]
            ]
          }
        }],
        [{ text: '', margin: [0, 0, 0, 20], colSpan: 2 }, {}],
        [
          { text: [{ text: 'Notes :\n' }, { text: trng.trng_comment || '\n', style: 'em' }], margin: [0, 0, 0, 20] }, {
            text: completed ? [
              { text: trng.registered + ' agents inscrits', style: 'em' },
              { text: ', dont\n' },
              { text: trng.validated + ' validés', style: 'success' },
              { text: ' et ' },
              { text: trng.flunked + ' recalés/absents', style: 'danger' }
            ] : '',
            alignment: 'right'
          }
        ]
      ]
    },
    layout: 'noBorders'
  };
}

function employeesTable(trainees, completed) {
  return {
    table: {
      widths: ['auto', 'auto', 'auto', 'auto', '*', 'auto'],
      body: [
        [
          { text: 'Matricule', style: 'primary' },
          { text: 'Titre', style: 'primary' },
          { text: 'Nom', style: 'primary' },
          { text: 'Prénom', style: 'primary' },
          { text: completed ? 'Commentaire' : 'Émargement', style: 'primary', alignment: 'center', colSpan: completed ? 1 : 2 },
          { text: 'Résultat', style: 'primary', alignment: 'right' }
        ]
      ].concat(_.map(trainees, function (empl, idx) {
        var outcome = empl.trem_outcome === 'VALIDATED';
        return [
          { text: empl.empl_pk, style: idx % 2 ? 'line-odd' : '' },
          { text: empl.empl_gender ? 'M.' : 'Mme', style: ['em', idx % 2 ? 'line-odd' : ''], alignment: 'right' },
          { text: empl.empl_surname, style: ['em', idx % 2 ? 'line-odd' : ''] },
          { text: empl.empl_firstname, style: ['em', idx % 2 ? 'line-odd' : ''] },
          { text: completed ? empl.trem_comment : '', style: idx % 2 ? 'line-odd' : '', colSpan: completed ? 1 : 2 },
          { text: _.unescape(outcome ? 'Valid&eacute;(e)' : 'Non valid&eacute;(e)'), style: [outcome ? 'success' : 'danger', idx % 2 ? 'line-odd' : ''], alignment: 'right' }
        ];
      }))
    },
    layout: completed ? reportsHelper.layouts.primary : extraPadding(reportsHelper.layouts.primary)
  };
}

module.exports = {
  generateSignInSheet: function generateSignInSheet(format, metadata, url, trng, trainees) {
    return reportsHelper.generatePDF({
      info: metadata,
      pageSize: format.format,
      pageOrientation: format.orientation,
      header: _.partialRight(reportsHelper.header, metadata.logo, trng.type.trty_name, _.unescape(trng.trng_outcome === 'COMPLETED' ? 'Proc&egrave;s Verbal' :
        'Feuille d\'&eacute;margement'), trng.displayDate),
      footer: _.partialRight(reportsHelper.footer, url)
    }, [trainingOverview(trng, trng.trng_outcome === 'COMPLETED'), employeesTable(trainees, trng.trng_outcome === 'COMPLETED')]);
  },
  generatePDF: function (format, metadata, datesCondition, filters, types, columns, data) {
    var content = [reportsHelper.center(coreSection(_(columns).filter('show').reject({ id: 'button' }).reject({ id: 'certs' }).value(), data))];
    if (datesCondition || types.length || _.keys(filters).length) {
      content.splice(0, 0, reportsHelper.center(filtersSection(datesCondition, _.values(filters), types)));
    }

    return reportsHelper.generatePDF({
      info: metadata,
      pageSize: format.format,
      pageOrientation: format.orientation,
      header: _.partialRight(reportsHelper.header, metadata.logo, 'Extraction des Formations', '')
    }, content);
  },
  generateXLSX: function (columns, data) {
    return reportsHelper.generateXLSX(reportsHelper.createSheet(columns, data, function (col, value) {
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
          return { v: value, t: _.isNumber(value) ? 'n' : 's' };
      }
    }));
  }
};
