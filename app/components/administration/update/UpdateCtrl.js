'use strict';

var _ = require('underscore');
var moment = require('moment');

module.exports = function ($scope, updateSvc, dataSvc, ngDialog, busySvc) {
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

  $scope.steps = [{
    step: 1,
    title: 'Chargement des donn&eacute;es',
    template: 'components/administration/update/step1.html'
  }, {
    step: 2,
    title: 'Analyse du fichier',
    template: 'components/administration/update/step2.html'
  }, {
    step: 3,
    title: 'Import de la mise &agrave; jour',
    template: 'components/administration/update/step3.html'
  }];
  $scope.currentStep = $scope.steps[0];

  $scope.step1 = {
    file: undefined,
    pageNumber: undefined,
    pageName: undefined,
    upload: function () {
      busySvc.busy();
      updateSvc.getMatrix($scope.step1.file, $scope.step1.pageNumber - 1, $scope.step1.pageName)
        .then(function (data) {
          $scope.headers = data[0];
          $scope.data = data.slice(1);
          $scope.currentStep = $scope.steps[1];
          busySvc.done();
        }, function () {
          busySvc.done();
          $scope.$emit('alert', {
            type: 'danger',
            msg: '<strong>Erreur&nbsp;:</strong> Le fichier selectionn&eacute; n\'a pas pu &ecirc;tre lu.<hr />Assurez-vous de disposer d\'un document au format <strong>.xls</strong> ou <strong>.xlsx</strong> et que le nom (ou le num&eacute;ro) de la page &agrave; charger est correctement reseign&eacute;.'
          });
        });
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
          var res = _.object(_.map($scope.step2.template, function (field, name) {
            return [name, entry[field.source] ? entry[field.source].trim() : ''];
          }));

          res.line = idx;
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

        $scope.invalidEmployees = _.where($scope.employees, { valid: false });
        $scope.currentStep = $scope.steps[2];
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
    update: function () {
      busySvc.busy();
      updateSvc.update($scope.employees).then(function () {
        $scope.$emit('alert', { type: 'success', msg: 'Mise &agrave; jour effectu&eacute;e avec succ&egrave;s.' });
        $scope.$emit('update');
        busySvc.done();
        window.history.back();
      }, function () {
        busySvc.done();
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
