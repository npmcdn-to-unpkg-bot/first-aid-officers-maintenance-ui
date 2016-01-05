'use strict';

var angular = require('angular');
require('ng-dialog');

angular.module('MyApp', ['ngDialog'])
	.controller('View1Ctrl', ['$scope', 'ngDialog', require('./view1/view1.js')])
	.controller('View2Ctrl', ['$scope', require('./view2/view2.js')]);