'use strict';

var _ = require('lodash');
var moment = require('moment');
var XLSX = require('xlsx-browerify-shim');

module.exports = function ($scope, updateSvc, dataSvc, ngDialog, busySvc, NgTableParams) {
  $scope.headers = [];
  $scope.data = [
    []
  ];
  $scope.employees = [];

  busySvc.busy();
  dataSvc.getAllSites().then(function (sites) {
    $scope.sites = sites;
    busySvc.done();
  }, function () {
    busySvc.done();
  });

  $scope.steps = [
    { step: 1, title: 'Chargement des donn&eacute;es', template: 'components/administration/update/step1.html' },
    { step: 2, title: 'Analyse du fichier', template: 'components/administration/update/step2.html' },
    { step: 3, title: 'Import de la mise &agrave; jour', template: 'components/administration/update/step3.html' }
  ];
  $scope.currentStep = $scope.steps[0];

  function numdate(v) {
    var date = XLSX.SSF.parse_date_code(v);
    var val = new Date();
    val.setUTCDate(date.d);
    val.setUTCMonth(date.m - 1);
    val.setUTCFullYear(date.y);
    val.setUTCHours(date.H);
    val.setUTCMinutes(date.M);
    val.setUTCSeconds(date.S);
    return val;
  }

  function parseSheet(sheet) {
    var data = [];
    var range = XLSX.utils.decode_range(sheet['!ref']);
    for (var r = range.s.r; r <= range.e.r; r++) {
      var row = [];
      for (var c = range.s.c; c <= range.e.c; c++) {
        var cell = sheet[XLSX.utils.encode_cell({ r: r, c: c })];
        if (cell) {
          if (cell.t === 'n' && cell.w.indexOf('/') !== -1) {
            row.push(moment(numdate(cell.v)).format('YYYY-MM-DD'));
          } else {
            row.push(cell.v.toString());
          }
        } else {
          row.push('');
        }
      }

      data.push(row);
    }
    return data;
  }

  $scope.step1 = {
    file: undefined,
    pageNumber: undefined,
    pageName: undefined,
    readfile: function (file) {
      busySvc.busy('step1.readfile', true);
      var reader = new FileReader();
      reader.onload = function (e) {
        $scope.step1.workbook = XLSX.read(e.target.result, { type: 'binary' });
        busySvc.done('step1.readfile');
      };

      reader.readAsBinaryString(file);
    },
    next: function () {
      busySvc.busy();
      var data = parseSheet($scope.step1.workbook.Sheets[$scope.step1.sheetName]);
      if ($scope.step1.header) {
        $scope.headers = data[0];
        $scope.data = data.slice(1);
      } else {
        $scope.headers = _.range(data[0].length).map(function (idx) {
          return 'Colonne ' + (idx > 25 ? _.get('0ABCDEFGHIJKLMNOPQRSTUVWXYZ', Math.floor(idx / 26)) : '') + _.get('ABCDEFGHIJKLMNOPQRSTUVWXYZ', idx % 26);
        });

        $scope.data = data;
      }

      $scope.currentStep = $scope.steps[1];
      busySvc.done();
    }
  };

  $scope.step2 = {
    current: 0,
    prev: function () {
      $scope.step2.current = Math.max(0, $scope.step2.current - 1);
      _.each($scope.step2.template, function (field, name) {
        field.feedback = $scope.step2.feedback(field, name);
      });
    },
    next: function () {
      $scope.step2.current = Math.min($scope.data.length - 1, $scope.step2.current + 1);
      _.each($scope.step2.template, function (field, name) {
        field.feedback = $scope.step2.feedback(field, name);
      });
    },
    validate: function () {
      busySvc.busy();
      setTimeout(function () {
        $scope.employees = _.map($scope.data, function (entry, idx) {
          var res = _.mapValues($scope.step2.template, function (field) {
            return entry[field.source] ? entry[field.source].trim() : ''
          });

          res.line = idx + 1;
          _.each($scope.step2.template, function (field, name) {
            if (!$scope.step3.validate(name, entry[field.source] ? entry[field.source].trim() : '')) {
              if (res.error) {
                res.error.push(name);
              } else {
                res.error = [name];
              }

              return false;
            }

            return true;
          });
          res.valid = !res.error;

          return res;
        });

        $scope.invalidEmployees = _.filter($scope.employees, { valid: false });
        $scope.currentStep = $scope.steps[2];
        $scope.step3.tp = new NgTableParams({ sorting: { empl_surname: 'asc' }, count: 10 }, {
          filterDelay: 0,
          defaultSort: 'asc',
          dataset: $scope.invalidEmployees
        });
        busySvc.done();
        $scope.$apply();
      }, 100);
    },
    feedback: function (field, name) {
      if (field.source !== undefined) {
        return $scope.step3.validate(name, $scope.data[$scope.step2.current][field.source]);
      }

      return;
    },
    template: {
      'empl_pk': {
        display: 'Matricule',
        rule: 'Doit être renseigné'
      },
      'empl_surname': {
        display: 'Nom de famille',
        rule: 'Doit être renseigné'
      },
      'empl_firstname': {
        display: 'Prénom',
        rule: 'Doit être renseigné'
      },
      'empl_gender': {
        display: 'Sexe',
        rule: 'Doit être soit \'masculin\' soit \'féminin\''
      },
      'empl_addr': {
        display: 'Adresse e-mail',
        rule: 'Facultative'
      },
      'empl_permanent': {
        display: 'Type de contrat',
        rule: 'Doit être soit \'CDI\' soit \'CDD\''
      },
      'empl_dob': {
        display: 'Date de naissance',
        rule: 'Doit être au format YYYY-MM-DD'
      },
      'siem_site_fk': {
        display: 'Code Aurore d\'affectation',
        rule: 'Doit correspondre à un code Aurore existant'
      }
    }
  };

  $scope.step3 = {
    cols: [
      { id: 'button' },
      { title: 'Ligne', sortable: 'line', filter: { line: 'text' }, field: 'line', width: '1%' },
      { title: 'Matricule', sortable: 'empl_pk', filter: { empl_pk: 'text' }, field: 'empl_pk', width: '10%' },
      { title: 'Nom', sortable: 'empl_surname', filter: { empl_surname: 'text' }, id: 'empl_surname', shrinkable: true, width: '30%' },
      { title: 'Pr&eacute;nom', sortable: 'empl_firstname', filter: { empl_firstname: 'text' }, id: 'empl_firstname', shrinkable: true, width: '30%' },
      { title: 'Erreur(s)', id: 'error', width: '30%' }
    ],
    update: function () {
      busySvc.busy('actualUpdate', true);
      updateSvc.update($scope.employees).then(function () {
        $scope.$emit('alert', { type: 'success', msg: 'Mise &agrave; jour effectu&eacute;e avec succ&egrave;s.' });
        $scope.$emit('update');
        busySvc.done('actualUpdate');
        window.history.back();
      }, function () {
        busySvc.done('actualUpdate');
      });
    },
    validate: function (name, value) {
      if (value === undefined) {
        return false;
      }

      switch (name) {
        case 'empl_addr':
          return true;
        case 'empl_dob':
          return moment(value, 'YYYY-MM-DD', true).isValid();
        case 'empl_permanent':
          return value.toUpperCase() === 'CDI' || value.toUpperCase() === 'CDD';
        case 'empl_gender':
          return value.toUpperCase() === 'MASCULIN' || value.toUpperCase() === 'FÉMININ';
        case 'siem_site_fk':
          return $scope.sites[value] !== undefined;
        default:
          return value !== undefined && value !== '';
      }
    },
    open: function (empl) {
      var dialogScope = $scope.$new(true);
      dialogScope.empl = empl;
      dialogScope.sites = $scope.sites;
      dialogScope.template = $scope.step2.template;

      ngDialog.open({
        templateUrl: 'components/dialogs/imported_employee.html',
        scope: dialogScope
      });
    }
  };
};
