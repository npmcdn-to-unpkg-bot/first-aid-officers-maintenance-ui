'use strict';

var $ = window.jQuery = require('jquery');
var angular = require('angular');
require('bootstrap_material_design');
require('angular-bootstrap');
require('angular-bootstrap-templates');
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
	  //document.getElementById('top-panel').style['background-image'] = 'url(' + pattern.png() + ')';
	}
	window.onresize = trianglify;

	trianglify();
});

angular.module('faomaintenanceApp', [
	require('angular-cookies'),
	require('angular-animate'),
	require('angular-route'),
	require('angular-sanitize'),
	require('./filters/customFilters'),
	require('ng-dialog'),
	'ui.bootstrap'
]).config(['$routeProvider', 'ngDialogProvider', function ($routeProvider, $ngDialogProvider) {
	$ngDialogProvider.setDefaults({
		showClose: false
	});
	$routeProvider
		.when('/home', {
			templateUrl: 'home/home.html',
			controller: 'HomeCtrl'
		}).when('/account', {
			templateUrl: 'account/account.html',
			controller: 'AccountCtrl'
		});
}])
	.directive('ifRole', ['$rootScope', 'ngIfDirective', require('./directives/ifRole.js')])
	.directive('loading', [require('./directives/loading.js')])
	.factory('ApiSvc', ['$http', '$q', require('./services/ApiSvc.js')])
	.factory('AdminSvc', ['$http', '$q', '$rootScope', 'ApiSvc', require('./services/AdminSvc.js')])
	.factory('AuthenticationSvc', ['$http', '$cookies', '$rootScope', '$timeout', 'ApiSvc', require('./services/AuthenticationSvc.js')])
	.controller('AccountCtrl', ['$scope', '$rootScope', 'AdminSvc', 'ngDialog', require('./account/AccountCtrl.js')])
	.controller('HomeCtrl', ['$scope', 'ngDialog', require('./home/HomeCtrl.js')])
	.controller('LoginCtrl', ['$rootScope', '$location', 'AuthenticationSvc', 'ngDialog', '$window', require('./index/LoginCtrl.js')])
	.controller('IndexCtrl', ['$rootScope', '$scope', '$document', '$location', 'ngDialog', require('./index/IndexCtrl.js')])
	.run(['$rootScope', '$location', '$cookies', '$http', 'ngDialog', 'AuthenticationSvc', function ($rootScope, $location, $cookies, $http, dialog, AuthenticationService) {
		// keep user logged in after page refresh
		$rootScope.currentUser = $cookies.getObject('currentUser');
		if ($rootScope.currentUser) {
			$http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.currentUser.authdata; // jshint ignore:line
		}

		$rootScope.disconnect = function () {
			$location.path('/home');
			AuthenticationService.ClearCredentials();
		};

		$rootScope.alerts = [];

		$rootScope.$on('$locationChangeStart', function () {
			// redirect to login page if not logged in and trying to access a restricted page
			var restrictedPage = $.inArray($location.path(), ['/login', '/home']) === -1;
			var loggedIn = $rootScope.currentUser;
			if (restrictedPage && !loggedIn) {
				dialog.openConfirm({
					template: 'home/login.html',
					controller: 'LoginCtrl',
					controllerAs: 'vm'
				});
			}
		});
	}
]);
