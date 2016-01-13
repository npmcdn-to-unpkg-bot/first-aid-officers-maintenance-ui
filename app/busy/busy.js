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
    var state = {global: 0};
    var listeners = {};

    function notify (task) {
      (listeners[task] || []).forEach(function (callback) {
        callback(state[task] > 0);
      });
    }
    
    return {
      register: function (callback, task) {
        task = task ? task : 'global';
        if(listeners[task]) {
          listeners[task].push(callback);
        } else {
           listeners[task] = [callback];
        }
        
        callback(state[task] > 0);
      },
      busy: function (task) {
        if(task && task !== 'global') {
          if(1 === (state[task] = state[task] ? state[task] + 1 : 1)) {
            notify(task);
          }
        }
        
        if(1 === (state.global = state.global + 1)) {
          notify('global');
        }
      },
      done: function (task) {
        if(task && task !== 'global') {
          if(!(state[task] = state[task] ? state[task] - 1 : 0)) {
            notify(task);
          }
        }
        
        if(!(state.global = state.global ? state.global - 1 : 0)) {
          notify('global');
        }
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
      scope: {
        task: '@busyTask'
      },
      link: function (scope) {
        busySvc.register(function (busy) {
          scope.busy = busy;
        }, scope.task);
      }
    };
  }]);

module.exports = moduleName;