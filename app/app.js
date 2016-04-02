'use strict';

var $ = window.jQuery = require('jquery');
var angular = require('angular');
require('angular-bootstrap-templates');
require('angular-i18n-fr');
require('angular-smart-table');
require('bootstrap_material_design');
require('bootstrap-switch');
require('moment-fr');
var Trianglify = require('trianglify');

$(function () {
  $.material.init({
    validate: false
  });

  function trianglify() {
    /*jshint camelcase: false*/
    var pattern = new Trianglify({
      width: window.innerWidth,
      height: window.innerHeight,
      x_colors: 'Blues'
    });

    document.body.style['background-image'] = 'url(' + pattern.png() + ')';
  }

  if (screen.width > 768) {
    trianglify();
    document.body.style['background-attachment'] = 'fixed';
    window.onresize = trianglify;
  }
});
angular.module('smart-table').run(['$templateCache', function ($templateCache) {
  $templateCache.put('template/smart-table/pagination.html',
    '    <nav ng-if="numPages && pages.length > 1">' +
    '        <ul class="pagination">' +
    '            <li ng-click="selectPage(1)" ng-class="{\'disabled\': currentPage == 1}"><a href="javascript:void(0)">&laquo;</a></li>' +
    '            <li ng-click="selectPage(currentPage - 1)" ng-class="{\'disabled\': currentPage == 1}"><a href="javascript:void(0)">&lsaquo;</a></li>' +
    '            <li ng-repeat="page in pages" ng-class="{\'active\': page == currentPage}" ng-click="selectPage(page)"><a href="javascript:void(0)">{{page}}</a></li>' +
    '            <li ng-click="selectPage(currentPage + 1)" ng-class="{\'disabled\': currentPage == numPages}"><a href="javascript:void(0)">&rsaquo;</a></li>' +
    '            <li ng-click="selectPage(numPages)" ng-class="{\'disabled\': currentPage == numPages}"><a href="javascript:void(0)">&raquo;</a></li>' +
    '        </ul>' +
    '    </nav>');
}]);

angular.module('faomaintenanceApp', [
    require('angular-cookies'),
    require('angular-animate'),
    require('angular-route'),
    require('angular-sanitize'),
    require('./filters/customFilters'),
    require('./busy/busy.js'),
    require('ng-dialog'),
    'ui.bootstrap',
    'smart-table',
  ]).config(['$routeProvider', 'ngDialogProvider', 'uibButtonConfig', '$httpProvider', function ($routeProvider, ngDialogProvider, uibButtonConfig, $httpProvider) {
    uibButtonConfig.activeClass = 'btn-primary';

    $httpProvider.interceptors.push(['$q', '$rootScope', function ($q, $rootScope) {
      return {
        request: function (config) {
          if (($rootScope.currentUser === undefined || $rootScope.currentUser.info === undefined) && /(?:[^:]+:)?\/\/[^:\/]+(?::\d+)?\/api\/(?!auth\/)/.test(config.url)) {
            return $q.reject('Unauthentified API call');
          }

          return config;
        },
        responseError: function (response) {
          return $q.reject(response);
        }
      };
    }]);

    ngDialogProvider.setDefaults({
      className: 'ngdialog-theme-gfs',
      showClose: false
    });

    $routeProvider
      .otherwise({
        redirectTo: '/home'
      })
      .when('/home', {
        templateUrl: 'components/home/home.html',
        controller: 'HomeCtrl'
      })
      .when('/account', {
        templateUrl: 'components/account/account.html',
        controller: 'AccountCtrl'
      })

    // Employees
    .when('/employees', {
        templateUrl: 'components/employees/employees.html',
        controller: 'EmployeesCtrl'
      })
      .when('/employees/:empl_pk', {
        templateUrl: 'components/employees/employee.html',
        controller: 'EmployeeCtrl'
      })

    // Sites
    .when('/sites', {
        templateUrl: 'components/sites/sites.html',
        controller: 'SitesCtrl'
      })
      .when('/sites/:site_pk', {
        templateUrl: 'components/sites/site.html',
        controller: 'SiteCtrl'
      })

    // Trainings
    .when('/trainings', {
        templateUrl: 'components/trainings/trainings.html',
        controller: 'TrainingsCtrl'
      })
      .when('/trainings/create', {
        templateUrl: 'components/trainings/training_edit.html',
        controller: 'TrainingEditCtrl'
      })
      .when('/trainings/stats', {
        templateUrl: 'components/trainings/trainings_stats.html',
        controller: 'TrainingsStatsCtrl'
      })
      .when('/trainings/:trng_pk', {
        templateUrl: 'components/trainings/training.html',
        controller: 'TrainingCtrl'
      })
      .when('/trainings/:trng_pk/edit', {
        templateUrl: 'components/trainings/training_edit.html',
        controller: 'TrainingEditCtrl'
      })
      .when('/trainings/:trng_pk/complete', {
        templateUrl: 'components/trainings/training_completion.html',
        controller: 'TrainingCompletionCtrl'
      })

    // Administration
    .when('/administration/sites', {
        templateUrl: 'components/administration/sites/sites_administration.html',
        controller: 'SitesAdministrationCtrl'
      })
      .when('/administration/users', {
        templateUrl: 'components/administration/users/users_administration.html',
        controller: 'UsersAdministrationCtrl'
      })
      .when('/administration/update', {
        templateUrl: 'components/administration/update/update.html',
        controller: 'UpdateCtrl'
      });
  }])
  .directive('bswitch', ['$parse', require('./directives/bSwitch.js')])
  .directive('fileread', [require('./directives/fileread.js')])
  .directive('formValidity', [require('./directives/formValidity.js')])
  .directive('ifRole', ['$rootScope', 'ngIfDirective', require('./directives/ifRole.js')])
  .directive('loading', [require('./directives/loading.js')])
  .directive('stateSustain', ['$rootScope', '$cookies', require('./directives/stateSustain.js')])
  .directive('stSelectDistinct', ['$parse', require('./directives/stSelectDistinct.js')])
  .directive('stSelectDate', ['dateFilter', require('./directives/stSelectDate.js')])
  .factory('ApiSvc', ['$http', '$q', require('./services/ApiSvc.js')])
  .factory('AdminSvc', ['$http', '$q', 'ApiSvc', require('./services/AdminSvc.js')])
  .factory('AuthenticationSvc', ['$http', '$cookies', '$rootScope', 'ApiSvc', require('./services/AuthenticationSvc.js')])
  .factory('EmployeesNotesSvc', ['ApiSvc', require('./services/EmployeesNotesSvc.js')])
  .factory('DataSvc', ['$http', '$q', 'ApiSvc', '$filter', require('./services/DataSvc.js')])
  .factory('TrainingsSvc', ['ApiSvc', require('./services/TrainingsSvc.js')])
  .factory('UpdateSvc', ['$http', '$q', 'ApiSvc', require('./services/UpdateSvc.js')])

.controller('AccountCtrl', ['$scope', '$rootScope', 'AdminSvc', 'ngDialog', 'BusySvc', require('./components/account/AccountCtrl.js')])
  .controller('DepartmentEditCtrl', ['$rootScope', '$scope', 'UpdateSvc', 'ngDialog', '$route', require('./components/dialogs/department_edit/DepartmentEditCtrl.js')])
  .controller('EmployeesCtrl', ['$scope', '$location', 'DataSvc', 'BusySvc', require('./components/employees/EmployeesCtrl.js')])
  .controller('EmployeeCtrl', ['$rootScope', '$scope', '$routeParams', 'DataSvc', 'AdminSvc', '$location', 'ngDialog', '$route', 'BusySvc', 'EmployeesNotesSvc', require('./components/employees/EmployeeCtrl.js')])
  .controller('HomeCtrl', ['$scope', 'ngDialog', require('./components/home/HomeCtrl.js')])
  .controller('IndexCtrl', ['$rootScope', '$scope', '$document', '$location', 'ngDialog', 'DataSvc', require('./components/index/IndexCtrl.js')])
  .controller('LoginCtrl', ['$rootScope', '$location', 'AuthenticationSvc', 'ngDialog', '$window', require('./components/index/LoginCtrl.js')])
  .controller('RolesEditCtrl', ['$rootScope', '$scope', 'AdminSvc', 'ngDialog', require('./components/dialogs/roles_edit/RolesEditCtrl.js')])
  .controller('SiteCtrl', ['$scope', '$routeParams', '$location', 'DataSvc', 'BusySvc', 'ngDialog', require('./components/sites/SiteCtrl.js')])
  .controller('SiteStatsCtrl', ['$scope', '$routeParams', 'DataSvc', 'BusySvc', require('./components/sites/SiteStatsCtrl.js')])
  .controller('SitesCtrl', ['$scope', '$location', 'DataSvc', 'BusySvc', require('./components/sites/SitesCtrl.js')])
  .controller('SitesAdministrationCtrl', ['$scope', 'DataSvc', 'ngDialog', '$route', 'BusySvc', require('./components/administration/sites/SitesAdministrationCtrl.js')])
  .controller('SiteEditCtrl', ['$rootScope', '$scope', 'UpdateSvc', 'ngDialog', '$route', require('./components/dialogs/site_edit/SiteEditCtrl.js')])
  .controller('SiteCreationCtrl', ['$rootScope', '$scope', 'UpdateSvc', 'ngDialog', '$route', require('./components/dialogs/site_edit/SiteCreationCtrl.js')])
  .controller('TrainingCtrl', ['$scope', '$rootScope', '$routeParams', 'DataSvc', 'TrainingsSvc', '$location', 'ngDialog', 'BusySvc', 'dateFilter', require('./components/trainings/TrainingCtrl.js')])
  .controller('TrainingsCtrl', ['$scope', 'DataSvc', '$location', 'BusySvc', require('./components/trainings/TrainingsCtrl.js')])
  .controller('TrainingCompletionCtrl', ['$scope', '$rootScope', '$routeParams', 'DataSvc', '$location', 'ngDialog', 'TrainingsSvc', 'BusySvc', 'dateFilter', require('./components/trainings/TrainingCompletionCtrl.js')])
  .controller('TrainingEditCtrl', ['$scope', '$rootScope', '$routeParams', 'DataSvc', 'TrainingsSvc', '$location', 'ngDialog', 'dateFilter', 'BusySvc', require('./components/trainings/TrainingEditCtrl.js')])
  .controller('TrainingsStatsCtrl', ['$scope', '$rootScope', 'DataSvc', 'dateFilter', 'BusySvc', 'ngDialog', require('./components/trainings/TrainingsStatsCtrl')])
  .controller('UpdateCtrl', ['$scope', '$rootScope', 'UpdateSvc', 'DataSvc', 'ngDialog', 'BusySvc', require('./components/administration/update/UpdateCtrl.js')])
  .controller('UsersAdministrationCtrl', ['$scope', '$rootScope', 'DataSvc', 'AdminSvc', 'ngDialog', '$route', '$location', 'BusySvc', require('./components/administration/users/UsersAdministrationCtrl.js')])

.run(['$rootScope', '$location', '$cookies', '$http', 'ngDialog', 'AuthenticationSvc', function ($rootScope, $location, $cookies, $http, ngDialog, authenticationSvc) {
  // keep user logged in after page refresh
  $rootScope.currentUser = $cookies.getObject('currentUser');
  if ($rootScope.currentUser) {
    $http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.currentUser.authdata; // jshint ignore:line
  }

  $rootScope.disconnect = function () {
    $location.path('/home');
    authenticationSvc.ClearCredentials();
  };

  $rootScope.alerts = [];

  $rootScope.$on('$locationChangeStart', function (event, newUrl, oldUrl) {
    // redirect to login page if not logged in and trying to access a restricted page
    var restrictedPage = $.inArray($location.path(), ['/login', '/home']) === -1;
    var loggedIn = $rootScope.currentUser;
    if (restrictedPage && !loggedIn) {
      ngDialog.closeAll();
      ngDialog.openConfirm({
        template: 'components/index/login.html',
        controller: 'LoginCtrl',
        controllerAs: 'vm'
      });
    }

    if (newUrl !== oldUrl && /\/trainings\/([^\/]+\/)?(create|edit|complete)/.test(oldUrl) && !($location.search().force)) {
      event.preventDefault();
      var dialogScope = $rootScope.$new(true);
      dialogScope.innerHtml = '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">abandonner l\'op&eacute;ration en cours</span>&nbsp;?';
      ngDialog.openConfirm({
        template: 'components/dialogs/warning.html',
        scope: dialogScope
      }).then(function () {
        $location.path(newUrl.substring($location.absUrl().length - $location.url().length)).search('force', true);
      });
    }
  });

  $rootScope.$on('$locationChangeSuccess', function () {
    $location.search('force', null).replace();
  });
}]);
