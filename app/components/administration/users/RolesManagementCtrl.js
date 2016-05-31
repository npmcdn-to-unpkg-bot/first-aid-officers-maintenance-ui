'use strict';

var _ = require('lodash');

module.exports = function ($rootScope, $scope, $route, busySvc, dataSvc, adminSvc, ngDialog) {
  $scope.roleTypes = {
    'administration': {
      users: false,
      general: false
    },
    'data-manipulation': {
      filter: false,
      types: []
    },
    'data-access': {
      trainings: false,
      general: false,
      types: [],
      filter: false,
      site: false,
      department: false
    },
    'user': {}
  };

  $scope.roles = _.each([{
    role_name: 'Manager',
    role_type: 'administration',
    role_short: 'mngr'
  }, {
    role_name: 'Administrateur',
    role_type: 'administration',
    role_short: 'admin'
  }, {
    role_name: 'Formateur',
    role_type: 'data-manipulation',
    role_short: 'form'
  }, {
    role_name: 'Responsable SST',
    role_type: 'data-manipulation',
    role_short: 'RSST'
  }, {
    role_name: 'Conseiller Technique Securite',
    role_type: 'data-access',
    role_short: 'CTS'
  }, {
    role_name: 'Acces global',
    role_type: 'data-access',
    role_short: 'global'
  }, {
    role_name: 'Equipe Locale de Direction',
    role_type: 'data-access',
    role_short: 'ELD'
  }, {
    role_name: 'Utilisateur',
    role_type: 'user',
    role_short: 'user'
  }], function (role) {
    role.type = _.clone($scope.roleTypes[role.role_type]);
  });

  $scope.typeFor = function (typeId) {
    switch (typeId) {
      case 'administration':
        return {
          color: 'success',
          name: 'Administration',
          short: 'admin'
        };

      case 'data-manipulation':
        return {
          color: 'warning',
          name: 'Manipulation de donnees',
          short: 'manip'
        };

      case 'data-access':
        return {
          color: 'primary',
          name: 'Visualisation de donnees',
          short: 'visu'
        };

      default:
        return {
          color: 'default',
          name: 'Utilisateur',
          short: 'user'
        };
    }
  };
};
