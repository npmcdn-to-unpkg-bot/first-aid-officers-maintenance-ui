'use strict';

var $ = window.jQuery = require('jquery');
var angular = require('angular');
require('bootstrap_material_design');
$(function() {
    $.material.init();
});

angular.module('faomaintenanceApp', [
	require('angular-cookies'),
	require('angular-route'),
	require('angular-sanitize'),
	require('ng-dialog'),
]).config(['$routeProvider', 'ngDialogProvider', function ($routeProvider, $ngDialogProvider) {
	$ngDialogProvider.setDefaults({
		showClose: false
	});
	$routeProvider
		.when('/home', {
			templateUrl: 'home/home.html',
			controller: 'HomeCtrl'
		});
}])
	.factory('ApiSvc', ['$http', '$q', require('./services/ApiSvc.js')])
	.factory('AuthenticationSvc', ['$http', '$cookies', '$rootScope', '$timeout', 'ApiSvc', require('./services/AuthenticationSvc.js')])
	.controller('HomeCtrl', ['$scope', 'ngDialog', require('./home/HomeCtrl.js')])
	.controller('LoginCtrl', ['$rootScope', '$location', 'AuthenticationSvc', 'ngDialog', '$window', require('./index/LoginCtrl.js')])
	.controller('IndexCtrl', ['$rootScope', '$scope', '$document', '$location', 'ngDialog', require('./index/IndexCtrl.js')])
	.controller('HeaderCtrl', ['$scope', '$location', require('./index/HeaderCtrl.js')])
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

		$rootScope.$on('$locationChangeStart', function (event, next, current) {
			// redirect to login page if not logged in and trying to access a restricted page
			var restrictedPage = $.inArray($location.path(), ['/login', '/home']) === -1;
			var loggedIn = $rootScope.currentUser;
			if (restrictedPage && !loggedIn) {
				dialog.openConfirm({
					template: 'partials/login.html',
					controller: 'LoginController',
					controllerAs: 'vm',
					showClose: false
				});
			}
		});
	}
]);
