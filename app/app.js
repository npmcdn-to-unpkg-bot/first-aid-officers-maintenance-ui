'use strict';

var $ = window.jQuery = require('jquery');
var angular = require('angular');
require('angular-bootstrap');
require('angular-bootstrap-templates');
require('angular-i18n-fr');
require('angular-smart-table');
require('bootstrap_material_design');
require('moment-fr');
var Trianglify = require('trianglify');

$(function() {
  $.material.init();

	function trianglify()	{
		/*jshint camelcase: false*/
	  var pattern = new Trianglify({
		  width: window.innerWidth,
		  height: window.innerHeight,
		  x_colors: 'Blues'
	  });

	  document.body.style['background-image'] = 'url(' + pattern.png() + ')';
	}
	trianglify();
  document.body.style['background-attachment'] = 'fixed';

	window.onresize = trianglify;
});
angular.module('smart-table').run(['$templateCache', function ($templateCache) {
    $templateCache.put('template/smart-table/pagination.html',
'    <nav ng-if="numPages && pages.length > 1">' +
'        <ul class="pagination">' +
'            <li ng-click="selectPage(1)" ng-class="{\'disabled\': currentPage == 1}"><span>&laquo;</span></li>' +
'            <li ng-click="selectPage(currentPage - 1)" ng-class="{\'disabled\': currentPage == 1}"><span>&lsaquo;</span></li>' +
'            <li ng-repeat="page in pages" ng-class="{\'active\': page == currentPage}" ng-click="selectPage(page)"><span>{{page}}</span></li>' +
'            <li ng-click="selectPage(currentPage + 1)" ng-class="{\'disabled\': currentPage == numPages}"><span>&rsaquo;</span></li>' +
'            <li ng-click="selectPage(numPages)" ng-class="{\'disabled\': currentPage == numPages}"><span>&raquo;</span></li>' +
'        </ul>' +
'    </nav>');
}]);

angular.module('faomaintenanceApp', [
	require('angular-cookies'),
	require('angular-animate'),
	require('angular-route'),
	require('angular-sanitize'),
	require('./filters/customFilters'),
	require('ng-dialog'),
	'ui.bootstrap',
	'smart-table'
]).config(['$routeProvider', 'ngDialogProvider', 'uibButtonConfig', function ($routeProvider, ngDialogProvider, uibButtonConfig) {
	uibButtonConfig.activeClass = 'btn-primary';

	ngDialogProvider.setDefaults({
		showClose: false
	});

	$routeProvider
		.when('/home', {
			templateUrl: 'home/home.html',
			controller: 'HomeCtrl'
		})
		.when('/account', {
			templateUrl: 'account/account.html',
			controller: 'AccountCtrl'
		})
		.when('/employees', {
			templateUrl: 'employees/employees.html',
			controller: 'EmployeesCtrl'
		})
		.when('/employees/:empl_pk', {
			templateUrl: 'employees/employee.html',
			controller: 'EmployeeCtrl'
		})
		.when('/sites', {
			templateUrl: 'sites/sites.html',
			controller: 'SitesCtrl'
		})
		.when('/sites/:site_pk', {
			templateUrl: 'sites/site.html',
			controller: 'SiteCtrl'
		})
		.otherwise({
			redirectTo : '/home'
		});
}])
	.directive('ifRole', ['$rootScope', 'ngIfDirective', require('./directives/ifRole.js')])
	.directive('loading', [require('./directives/loading.js')])
	.directive('stateSustain', ['$rootScope', '$cookies', require('./directives/stateSustain.js')])
	.factory('ApiSvc', ['$http', '$q', require('./services/ApiSvc.js')])
	.factory('AdminSvc', ['$http', '$q', '$rootScope', 'ApiSvc', require('./services/AdminSvc.js')])
	.factory('AuthenticationSvc', ['$http', '$cookies', '$rootScope', '$timeout', 'ApiSvc', require('./services/AuthenticationSvc.js')])
	.factory('DataSvc', ['$http', '$q', '$rootScope', 'ApiSvc', '$filter', require('./services/DataSvc.js')])
	.controller('AccountCtrl', ['$scope', '$rootScope', 'AdminSvc', 'ngDialog', require('./account/AccountCtrl.js')])
	.controller('EmployeesCtrl', ['$scope', '$location', 'DataSvc', require('./employees/EmployeesCtrl.js')])
	.controller('EmployeeCtrl', ['$rootScope', '$scope', '$routeParams', 'DataSvc', 'AdminSvc', '$location', 'ngDialog', '$route', require('./employees/EmployeeCtrl.js')])
	.controller('HomeCtrl', ['$scope', 'ngDialog', require('./home/HomeCtrl.js')])
	.controller('IndexCtrl', ['$rootScope', '$scope', '$document', '$location', 'ngDialog', 'DataSvc', require('./index/IndexCtrl.js')])
	.controller('LoginCtrl', ['$rootScope', '$location', 'AuthenticationSvc', 'ngDialog', '$window', require('./index/LoginCtrl.js')])
	.controller('RolesEditCtrl', ['$rootScope', '$scope', 'AdminSvc', 'ngDialog', require('./dialogs/roles_edit/RolesEditCtrl.js')])
	.controller('SiteCtrl', ['$scope', '$routeParams', '$location', 'DataSvc', require('./sites/SiteCtrl.js')])
	.controller('SitesCtrl', ['$scope', '$location', 'DataSvc', require('./sites/SitesCtrl.js')])
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

		$rootScope.$on('$locationChangeStart', function () {
			// redirect to login page if not logged in and trying to access a restricted page
			var restrictedPage = $.inArray($location.path(), ['/login', '/home']) === -1;
			var loggedIn = $rootScope.currentUser;
			if (restrictedPage && !loggedIn) {
				ngDialog.closeAll();
				ngDialog.openConfirm({
					template: 'index/login.html',
					controller: 'LoginCtrl',
					controllerAs: 'vm'
				});
			}
		});
	}
]);
