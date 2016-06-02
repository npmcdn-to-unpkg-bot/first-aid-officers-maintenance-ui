'use strict';

var _ = require('lodash');

module.exports = function ($rootScope, $scope, $route, busySvc, dataSvc, adminSvc, ngDialog) {
  $scope.roles = [{
    role_name: 'Authentification',
    role_type: 'user'
  }, {
    role_name: 'Acces aux donnees',
    role_type: 'access',
    levels: [{ value: 1, color: 'danger' }, { value: 2, color: 'warning' }, { value: 3, color: 'primary' }, { value: 4, color: 'success' }]
  }, {
    role_name: 'Gestion des formations',
    role_type: 'trainer'
  }, {
    role_name: 'Administration',
    role_type: 'admin',
    levels: [{ value: 1, color: 'primary' }, { value: 2, color: 'success' }]
      //TODO: add level for employee notes and certificate exclusion.
  }];

  $scope.disabled = function (role) {
    switch (role.role_type) {
      case 'user':
        return false;
      case 'access':
        return !_.find($scope.roles, { role_type: 'user' }).checked;
      default:
        return !_.find($scope.roles, { role_type: 'access' }).checked;
    }
  };
};
