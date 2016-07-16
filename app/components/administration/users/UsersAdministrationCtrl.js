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
    { id: 'button', clazz: 'primary', on: 'hover', show: true, width: '1%' }, {
      title: 'Identifiant',
      sortable: 'user_id',
      filter: { user_id: 'text' },
      field: 'user_id',
      show: true,
      width: '1%',
      align: 'center'
    },
    { title: 'Utilisateur', sortable: 'summary', filter: { summary: 'text' }, id: 'summary', show: true, width: '50%' }, {
      title: 'Type',
      sortable: 'user_type',
      filter: { user_type: 'select' },
      id: 'user_type',
      show: true,
      width: '1%',
      align: 'right',
      data: [{ title: 'Agent', id: 'employee' }, { title: 'Site', id: 'site' }, { title: 'Département', id: 'department' }]
    }, {
      title: 'Gestion&nbsp;de&nbsp;compte',
      sortable: 'accountMgmt',
      filter: { 'accountMgmt': 'select' },
      id: 'roleUser',
      show: true,
      width: '1%',
      align: 'center',
      data: [{ title: 'Activée', id: 'true' }, { title: 'Non activée', id: 'false' }]
    }, {
      title: 'Acc&egrave;s',
      sortable: 'roles.access',
      id: 'roleLevel',
      filter: { 'roles.access': 'select' },
      field: 'roles.access',
      show: true,
      width: '1%',
      align: 'center',
      data: [{ title: 'Niv. 1', id: 1 }, { title: 'Niv. 2', id: 2 }, { title: 'Niv. 3', id: 3 }, { title: 'Niv. 4', id: 4 }]
    },
    { title: 'Profil&nbsp;formateur', sortable: 'roles.trainer', filter: { 'roles.trainer': 'select' }, id: 'roleTrainer', field: 'roles.trainer', show: true, width: '1%' }, {
      title: 'Administration',
      sortable: 'roles.admin',
      id: 'roleLevel',
      filter: { 'roles.admin': 'select' },
      field: 'roles.admin',
      show: true,
      width: '1%',
      align: 'right',
      data: [{ title: 'Niv. 1', id: 1 }, { title: 'Niv. 2', id: 2 }, { title: 'Niv. 3', id: 3 }, { title: 'Niv. 4', id: 4 }]
    }
  ];

  busySvc.busy('usersAdministration');
  Promise.all([dataSvc.getDepartments(), adminSvc.getTrainerProfiles(), adminSvc.getUsers()]).then(_.spread(function (departments, trainerProfiles, users) {
    $scope.departments = _.values(departments);
    _.find($scope.cols, { id: 'roleTrainer' }).data = _.map($scope.trainerProfiles = trainerProfiles, function (profile) {
      return { title: profile.trpr_id, id: profile.trpr_pk };
    });

    $scope.tp = new NgTableParams(_({ sorting: { user_id: 'asc' }, count: 10 }).extend($location.search()).mapValues(function (val) {
      return _.isString(val) ? decodeURI(val) : val;
    }).value(), {
      filterDelay: 0,
      defaultSort: 'asc',
      dataset: _.map(users, function (user) {
        return _.extend(user, {
          accountMgmt: user.roles && !!user.roles['user'], //jshint ignore: line
          summary: (function (type, resource) {
            switch (type) {
              case 'employee':
                return resource.empl_surname + ' ' + resource.empl_firstname;
              case 'site':
                return resource.site_name;
              case 'department':
                return resource.dept_name;
            }
          })(user.user_type, user)
        });
      })
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

  //TODO: support dept and site
  $scope.create = function () {
    ngDialog.open({
      template: './components/administration/users/account_create.html',
      scope: _.extend($scope.$new(), {
        types: [{ value: 'employee', display: 'Agent' }, { value: 'site', display: 'Site' }, { value: 'department', display: 'Département' }],
        disabled: function (user) {
          if (!user.user_id) {
            return true;
          }
          switch (user.user_type.value) {
            case 'employee':
              return !(user.link && user.link.empl_pk);
            case 'site':
              return !(user.link && user.link.site_pk);
            case 'department':
              return !(user.link && user.link.dept_pk);
            default:
              return true;
          }
        },
        employees: $scope.employees,
        callback: function (user, close) {
          ngDialog.openConfirm({
            template: './components/dialogs/warning.html',
            scope: _.extend($scope.$new(), {
              innerHtml: '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">cr&eacute;er un compte</span> pour <span class="text-warning">' +
                user.link.summary + '</span>&nbsp;?'
            })
          }).then(function () {
            adminSvc.createUser(user.user_id, _.extend({
              user_type: user.user_type.value,
              roles: {}
            }, (function (type, resource) {
              switch (type) {
                case 'employee':
                  return { user_empl_fk: resource.empl_pk };
                case 'site':
                  return { user_site_fk: resource.site_pk };
                case 'department':
                  return { user_dept_fk: resource.dept_pk };
              }
            })(user.user_type.value, user.link))).then(function (response) {
              $scope.$emit('alert', {
                type: 'success',
                msg: 'Mot de passe g&eacute;n&eacute;r&eacute; pour <strong>' + user.link.summary + '</strong>&nbsp: <kbd>' + response.data +
                  '</kbd><hr />Veuillez transmettre son/leur nouveau mot de passe &agrave;/aux agent(s) concern&eacute;(s).',
                static: true
              });
              $scope.select(user.user_id);
              close();
            }, function () {
              $scope.$emit('alert', {
                type: 'danger',
                msg: 'La cr&eacute;ation du nouveau compte a &eacute;chou&eacute;.<hr />Peut-&ecirc;tre existe-t\'il d&eacute;j&agrave; un compte li&eacute; &agrave; <strong>' +
                  user.link.summary + '</strong> ou utilisant cet identifiant&nbsp;?',
                static: true
              });
            });
          });
        }
      })
    });
  };

  $scope.select = function (user_id) {
    $location.path('administration/users/' + user_id).search({});
  };
};
