'use strict';
/*jshint camelcase: false*/

var _ = require('lodash');

module.exports = function ($rootScope, $scope, dataSvc, adminSvc, ngDialog, $route, $location, busySvc, NgTableParams) {
  $scope.typeFor = function (level) {
    switch (level) {
      case 1:
        return 'danger';
      case 2:
        return 'warning';
      case 3:
        return 'primary';
      case 4:
        return 'success';
    }
  };

  $scope.cols = [
    { id: 'button', clazz: 'primary', on: '(hover && !siteHover)', show: true, width: '1%' },
    { title: 'Matricule', sortable: 'empl_pk', filter: { empl_pk: 'text' }, field: 'empl_pk', show: true, width: '10%' },
    { title: 'Titre', sortable: 'empl_gender', id: 'empl_gender', align: 'right', show: true, width: '1%' },
    { title: 'Nom', sortable: 'empl_surname', filter: { empl_surname: 'text' }, id: 'empl_surname', shrinkable: true, show: true, width: '40%' },
    { title: 'Pr&eacute;nom', sortable: 'empl_firstname', filter: { empl_firstname: 'text' }, id: 'empl_firstname', shrinkable: true, show: true, width: '40%' },
    { title: 'Acc&egrave;s', sortable: 'roles.access', id: 'roleLevel', field: 'roles.access', show: true, width: '1%', align: 'center' },
    { title: 'Gestion&nbsp;de&nbsp;formation', sortable: 'roles.trainer', id: 'roleTrainer', field: 'roles.trainer', show: true, width: '1%', align: 'center' },
    { title: 'Administration', sortable: 'roles.admin', id: 'roleLevel', field: 'roles.admin', show: true, width: '1%', align: 'center' }
  ];

  busySvc.busy('usersAdministration');
  Promise.all([dataSvc.getEmployees(), adminSvc.getTrainerlevels(), adminSvc.getUsers()]).then(_.spread(function (employees, trainerlevels, users) {
    $scope.employees = _.values(employees);
    $scope.trainerlevels = trainerlevels;
    $scope.tp = new NgTableParams(_({ sorting: { empl_surname: 'asc' }, count: 10 }).extend($location.search()).mapValues(function (val) {
      return _.isString(val) ? decodeURI(val) : val;
    }).value(), {
      filterDelay: 0,
      defaultSort: 'asc',
      dataset: _.values(users)
    });

    $scope.$apply(); // force $location to sync with the browser
    $scope.$watch(function () {
      return JSON.stringify(_.mapKeys($scope.tp.url(), _.flow(_.nthArg(1), decodeURI)));
    }, function () {
      $location.search(_.mapValues(_.mapKeys($scope.tp.url(), _.flow(_.nthArg(1), decodeURI)), decodeURIComponent)).replace();
      setTimeout(function () {
        $scope.$apply(); // force $location to sync with the browser
      }, 0);
    });
    busySvc.done('usersAdministration');
  }), function () {
    busySvc.done('usersAdministration');
  });

  $scope.create = function () {
    ngDialog.open({
      template: './components/administration/users/employee_pick.html',
      scope: _.extend($scope.$new(), {
        employees: $scope.employees,
        callback: function (empl, close) {
          $scope.select(empl.empl_pk);
          close();
        }
      })
    });
  };

  $scope.select = function (empl_pk) {
    $location.path('administration/users/' + empl_pk).search({});
  };
};
