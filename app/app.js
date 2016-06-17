'use strict';

var $ = window.jQuery = require('jquery');
var angular = require('angular');
var _ = require('lodash');
require('angular-bootstrap-templates');
require('angular-i18n-fr');
require('angular-smart-table');
require('angular-ui-sortable');
require('bootstrap_material_design');
require('bootstrap-switch');
require('moment-fr');
require('ng-table');
require('../lib/jquery-ui.min.js');
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
    require('ccjmne-busy'),
    require('ng-dialog'),
    'ngTable',
    'ui.bootstrap',
    'ui.sortable',
    'smart-table'
  ]).config(['$routeProvider', 'ngDialogProvider', 'uibButtonConfig', '$httpProvider', '$provide',
    function ($routeProvider, ngDialogProvider, uibButtonConfig, $httpProvider, $provide) {
      $provide.decorator('orderByFilter', ['$delegate', '$parse', function ($delegate, $parse) {
        return function () {
          var predicates = arguments[1];
          var invertEmpties = false;
          if (true) {
            if (!angular.isArray(predicates)) {
              predicates = [predicates];
            }

            var newPredicates = [];
            angular.forEach(predicates, function (predicate) {
              if (angular.isString(predicate)) {
                var trimmed = predicate;
                if (trimmed.charAt(0) === '-') {
                  trimmed = trimmed.slice(1);
                }

                var keyFn = $parse(trimmed);
                newPredicates.push(function (item) {
                  var value = keyFn(item);
                  return (angular.isDefined(value) && value !== null) === invertEmpties;
                });
              }

              newPredicates.push(predicate);
            });

            predicates = newPredicates;
          }

          return $delegate(arguments[0], predicates, arguments[2]);
        };
      }]);

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
          controller: 'EmployeesCtrl',
          reloadOnSearch: false
        })
        .when('/employees/:empl_pk', {
          templateUrl: 'components/employees/employee.html',
          controller: 'EmployeeCtrl',
          reloadOnSearch: false
        })

      // Sites
      .when('/sites', {
          templateUrl: 'components/sites/sites.html',
          controller: 'SitesCtrl',
          reloadOnSearch: false
        })
        .when('/sites/:site_pk', {
          templateUrl: 'components/sites/site.html',
          controller: 'SiteCtrl',
          reloadOnSearch: false
        })

      // Trainings
      .when('/trainings', {
          templateUrl: 'components/trainings/trainings.html',
          controller: 'TrainingsCtrl',
          reloadOnSearch: false
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
      .when('/administration/certificates', {
          templateUrl: 'components/administration/certificates/certificates.html',
          controller: 'CertificatesCtrl'
        })
        .when('/administration/sites', {
          templateUrl: 'components/administration/sites/sites_administration.html',
          controller: 'SitesAdministrationCtrl'
        })
        .when('/administration/training_types', {
          templateUrl: 'components/administration/certificates/training_types.html',
          controller: 'TrainingTypesCtrl'
        })
        .when('/administration/users', {
          templateUrl: 'components/administration/users/users_administration.html',
          controller: 'UsersAdministrationCtrl'
        })
        .when('/administration/update', {
          templateUrl: 'components/administration/update/update.html',
          controller: 'UpdateCtrl'
        });
    }
  ])
  .directive('bswitch', ['$parse', require('./directives/bSwitch.js')])
  .directive('fileread', [require('./directives/fileread.js')])
  .directive('formValidity', [require('./directives/formValidity.js')])
  .directive('ifRole', ['$rootScope', 'ngIfDirective', require('./directives/ifRole.js')])
  .directive('stateSustain', ['$cookies', require('./directives/stateSustain.js')])
  .directive('stSelectDistinct', ['$parse', require('./directives/stSelectDistinct.js')])
  .directive('stSelectDate', ['dateFilter', require('./directives/stSelectDate.js')])
  .directive('hoverState', ['$parse', require('./directives/hoverState.js')])
  .factory('ApiSvc', ['$http', '$q', require('./services/ApiSvc.js')])
  .factory('AdminSvc', ['$http', '$q', 'ApiSvc', require('./services/AdminSvc.js')])
  .factory('AuthSvc', ['$http', '$q', '$cookies', 'ApiSvc', require('./services/AuthSvc.js')])
  .factory('EmployeesNotesSvc', ['ApiSvc', 'dateFilter', require('./services/EmployeesNotesSvc.js')])
  .factory('DataSvc', ['$http', '$q', 'ApiSvc', '$filter', require('./services/DataSvc.js')])
  .factory('TrainingsSvc', ['ApiSvc', require('./services/TrainingsSvc.js')])
  .factory('UpdateSvc', ['$http', '$q', 'ApiSvc', require('./services/UpdateSvc.js')])

.controller('AccountCtrl', ['$scope', '$rootScope', 'AdminSvc', 'ngDialog', 'BusySvc', require('./components/account/AccountCtrl.js')])
  .controller('CertificatesCtrl', ['$scope', 'UpdateSvc', 'DataSvc', 'BusySvc', 'ngDialog', '$route',
    require('./components/administration/certificates/CertificatesCtrl.js')
  ])
  .controller('DepartmentEditCtrl', ['$scope', 'UpdateSvc', 'ngDialog', '$route', require('./components/dialogs/department_edit/DepartmentEditCtrl.js')])
  .controller('EmployeeCtrl', ['$rootScope', '$scope', '$routeParams', 'DataSvc', 'AdminSvc', '$location', 'ngDialog', '$route', 'BusySvc', 'EmployeesNotesSvc', 'NgTableParams',
    require('./components/employees/EmployeeCtrl.js')
  ])
  .controller('EmployeesCtrl', ['$scope', '$location', 'DataSvc', 'BusySvc', 'NgTableParams', 'ngDialog', require('./components/employees/EmployeesCtrl.js')])
  .controller('HomeCtrl', ['$scope', 'ngDialog', 'BusySvc', require('./components/home/HomeCtrl.js')])
  .controller('IndexCtrl', ['$rootScope', '$scope', '$document', '$location', 'ngDialog', 'DataSvc', require('./components/index/IndexCtrl.js')])
  .controller('LoginCtrl', ['$scope', '$rootScope', '$route', 'AuthSvc', 'BusySvc', require('./components/index/LoginCtrl.js')])
  .controller('RolesEditCtrl', ['$rootScope', '$scope', 'AdminSvc', 'ngDialog', require('./components/dialogs/roles_edit/RolesEditCtrl.js')])
  .controller('SiteCtrl', ['$scope', '$routeParams', '$location', '$route', 'DataSvc', 'BusySvc', 'ngDialog', 'UpdateSvc', 'NgTableParams',
    require('./components/sites/SiteCtrl.js')
  ])
  .controller('SiteStatsCtrl', ['$scope', '$routeParams', 'DataSvc', 'BusySvc', require('./components/sites/SiteStatsCtrl.js')])
  .controller('SitesCtrl', ['$scope', '$location', '$cookies', 'DataSvc', 'BusySvc', 'NgTableParams', 'ngDialog', require('./components/sites/SitesCtrl.js')])
  .controller('SitesAdministrationCtrl', ['$scope', 'DataSvc', 'ngDialog', '$route', 'BusySvc', require('./components/administration/sites/SitesAdministrationCtrl.js')])
  .controller('SiteEditCtrl', ['$scope', 'UpdateSvc', 'ngDialog', '$route', require('./components/dialogs/site_edit/SiteEditCtrl.js')])
  .controller('SiteCreationCtrl', ['$scope', 'UpdateSvc', 'ngDialog', '$route', require('./components/dialogs/site_edit/SiteCreationCtrl.js')])
  .controller('TrainingCtrl', ['$scope', '$routeParams', 'DataSvc', 'TrainingsSvc', '$location', 'ngDialog', 'BusySvc', 'dateFilter',
    require('./components/trainings/TrainingCtrl.js')
  ])
  .controller('TrainingsCtrl', ['$scope', 'DataSvc', '$location', 'BusySvc', 'NgTableParams', 'ngDialog', require('./components/trainings/TrainingsCtrl.js')])
  .controller('TrainingCompletionCtrl', ['$scope', '$routeParams', 'DataSvc', '$location', 'ngDialog', 'TrainingsSvc', 'BusySvc', 'dateFilter',
    require('./components/trainings/TrainingCompletionCtrl.js')
  ])
  .controller('TrainingEditCtrl', ['$scope', '$routeParams', 'DataSvc', 'TrainingsSvc', '$location', 'ngDialog', 'dateFilter', 'BusySvc',
    require('./components/trainings/TrainingEditCtrl.js')
  ])
  .controller('TrainingsStatsCtrl', ['$scope', 'DataSvc', 'dateFilter', 'BusySvc', 'ngDialog', require('./components/trainings/TrainingsStatsCtrl')])
  .controller('TrainingTypesCtrl', ['$scope', 'UpdateSvc', 'DataSvc', 'BusySvc', 'ngDialog', '$route',
    require('./components/administration/certificates/TrainingTypesCtrl.js')
  ])
  .controller('UpdateCtrl', ['$scope', 'UpdateSvc', 'DataSvc', 'ngDialog', 'BusySvc', require('./components/administration/update/UpdateCtrl.js')])
  .controller('UsersAdministrationCtrl', ['$rootScope', '$scope', 'DataSvc', 'AdminSvc', 'ngDialog', '$route', '$location', 'BusySvc',
    require('./components/administration/users/UsersAdministrationCtrl.js')
  ])

.run(['$rootScope', '$location', '$route', '$cookies', '$http', 'ngDialog', 'BusySvc', 'AuthSvc', '$templateCache',
  function ($rootScope, $location, $route, $cookies, $http, ngDialog, busySvc, authSvc, $templateCache) {
    // Placeholder
    $templateCache.put('ng-table/filters/text.html',
      '<input type="text" name="{{name}}" placeholder="Rechercher..." ng-disabled="$filterRow.disabled" ng-model="params.filter()[name]" class="input-filter form-control" placeholder="{{getFilterPlaceholderValue(filter, name)}}"/> '
    );

    // colspan + hideHeader
    $templateCache.put('ng-table/sorterRow.html',
      '<tr class="ng-table-sort-header"> <th colspan="{{$column.colspan}}" title="{{$column.headerTitle(this)}}" ng-repeat="$column in $columns" ng-class="{ \'sortable\': $column.sortable(this), \'sort-asc\': params.sorting()[$column.sortable(this)]==\'asc\', \'sort-desc\': params.sorting()[$column.sortable(this)]==\'desc\' }" ng-click="sortBy($column, $event)" ng-if="$column.show(this) && !$column.hideHeader" ng-init="template=$column.headerTemplateURL(this)" class="header {{$column.class(this)}}"> <div ng-if="!template" class="ng-table-header" ng-class="{\'sort-indicator\': params.settings().sortingIndicator==\'div\'}"> <span ng-bind-html="$column.title(this)" ng-class="{\'sort-indicator\': params.settings().sortingIndicator==\'span\'}"></span> </div> <div ng-if="template" ng-include="template"></div> </th> </tr>'
    );

    // colspan + hideHeader
    $templateCache.put('ng-table/filterRow.html',
      '<tr ng-show="show_filter" class="ng-table-filters"> <th colspan="{{$column.colspan}}" data-title-text="{{$column.titleAlt(this) || $column.title(this)}}" ng-repeat="$column in $columns" ng-if="$column.show(this) && !$column.hideHeader" class="filter {{$column.class(this)}}" ng-class="params.settings().filterOptions.filterLayout===\'horizontal\' ? \'filter-horizontal\' : \'\'"> <div ng-repeat="(name, filter) in $column.filter(this)" ng-include="config.getTemplateUrl(filter)" class="filter-cell" ng-class="[getFilterCellCss($column.filter(this), params.settings().filterOptions.filterLayout), $last ? \'last\' : \'\']"> </div> </th> </tr> '
    );

    /* jshint multistr: true */
    $templateCache.put('ng-table/pager.html',
      '<div class="ng-table-pager panel-footer text-center" ng-if="pages.length"> \
          <ul ng-if="pages.length" class="pagination ng-table-pagination"> \
              <li ng-class="{\'disabled\': !page.active && !page.current, \'active\': page.current}" ng-repeat="page in pages" ng-switch="page.type"> \
                  <a ng-switch-when="prev" ng-click="params.page(page.number)" href="">&laquo;</a> \
                  <a ng-switch-when="first" ng-click="params.page(page.number)" href=""><span ng-bind="page.number"></span></a> \
                  <a ng-switch-when="page" ng-click="params.page(page.number)" href=""><span ng-bind="page.number"></span></a> \
                  <a ng-switch-when="more" ng-click="params.page(page.number)" href="">&#8230;</a> \
                  <a ng-switch-when="last" ng-click="params.page(page.number)" href=""><span ng-bind="page.number"></span></a> \
                  <a ng-switch-when="next" ng-click="params.page(page.number)" href="">&raquo;</a> \
              </li> \
          </ul> \
      </div>'
    );

    _.mixin({
      unescape: function (html) {
        var txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
      }
    }, { chain: false });

    $rootScope.currentUser = {};

    $rootScope.disconnect = function () {
      authSvc.logout();
      delete $rootScope.currentUser.info;
      $location.path('/home').search({});
    };

    busySvc.busy('auth-restore', true);
    authSvc.restoreSession().then(function (info) {
      $rootScope.currentUser.info = info;
      $rootScope.$broadcast('update');
      busySvc.done('auth-restore');
      $route.reload();
    }, _.partial(busySvc.done, 'auth-restore'));

    $rootScope.$on('$locationChangeStart', function (event, newUrl, oldUrl) {
      if (['/home'].indexOf($location.path()) === -1) {
        // wait until session restore is done
        busySvc.register(function (busy, unregister) {
          if (!busy) {
            unregister();
            if (!authSvc.isLoggedIn()) {
              busySvc.busy('auth');
              ngDialog.openConfirm({
                template: 'components/index/login.html',
                controller: 'LoginCtrl',
                preCloseCallback: _.partial(busySvc.done, 'auth')
              });
            }
          }
        }, 'auth-restore');
      }

      var searchPage = /([^/]+)\/(search|results)/;
      if (!searchPage.test(newUrl) || searchPage.test(oldUrl)[0] !== searchPage.test(newUrl)[0]) {
        $location.search('filter', null);
        $location.search('display', null);
      }

      if (busySvc.check('ongoingOperation')) {
        event.preventDefault();
        ngDialog.openConfirm({
          template: 'components/dialogs/warning.html',
          scope: _.extend($rootScope.$new(true), { innerHtml: '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">abandonner l\'op&eacute;ration en cours</span>&nbsp;?' })
        }).then(function () {
          busySvc.done('ongoingOperation');
          $location.url(newUrl.substring($location.absUrl().length - $location.url().length));
        });
      }
    });

    $rootScope.$on('$locationChangeSuccess', function () {
      ngDialog.closeAll();
    });
  }
]);
