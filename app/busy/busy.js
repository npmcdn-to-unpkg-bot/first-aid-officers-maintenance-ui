'use strict';

var moduleName = 'ccjmne-busy';
require('angular').module(moduleName, [])
	.run(['$templateCache', function ($templateCache) {
  	$templateCache.put('ccjmne-busy_tmpl.html',
  		`<div class="sk-folding-cube" ng-show="busy">
  			<div class="sk-cube1 sk-cube"></div>
  			<div class="sk-cube2 sk-cube"></div>
  			<div class="sk-cube4 sk-cube"></div>
  			<div class="sk-cube3 sk-cube"></div>
			</div>
			<div ng-transclude ng-show="!busy"></div>`);
  }])
	.factory('BusySvc', function () {
  	var busy = 0;
    var listeners = [];

    function notify() {
      listeners.forEach(function (callback) {
        callback(busy > 0);
      });
    }
    
		return {
    	register: function(callback){
				listeners.push(callback);
        callback(busy > 0);
  		},
    	busy: function() {
      	busy = busy + 1;
        notify();
			},
      done: function() {
      	busy = busy > 0 ? busy - 1 : 0;
        notify();
			}
		};
	})
  .directive('busy', ['BusySvc', function (busySvc) {
  	return {
    	restrict: 'EA',
      transclude: true,
      templateUrl: function (elem, attr) {
      	return attr.busyTemplate ? attr.busyTemplate : 'ccjmne-busy_tmpl.html';
      },
      scope: {},
    	link: function (scope) {
      	busySvc.register(function (busy) {
        	scope.busy = busy;
        });
      }
    };
  }]);

module.exports = moduleName;