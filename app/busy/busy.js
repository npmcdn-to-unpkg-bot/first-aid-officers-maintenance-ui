'use strict';

var moduleName = 'ccjmne-busy';
require('angular').module(moduleName, [])
  .run(['$templateCache', function ($templateCache) {
    /*jshint multistr: true*/
    $templateCache.put('ccjmne-busy_tmpl.html',
      '<div class="sk-folding-cube" ng-show="busy"> \
        <div class="sk-cube1 sk-cube"></div> \
        <div class="sk-cube2 sk-cube"></div> \
        <div class="sk-cube4 sk-cube"></div> \
        <div class="sk-cube3 sk-cube"></div> \
      </div> \
      <div ng-transclude ng-show="!busy"></div>');
  }])
  .factory('BusySvc', function () {
    var state = { global: { count: 0, detached: false } };
    var listeners = {};

    function notify(task) {
      (listeners[task] || []).forEach(function (callback) {
        callback(state[task].count > 0, function () {
          if (listeners[task].indexOf(callback) > 0) {
            listeners[task].splice(listeners[task].indexOf(callback), 1);
          }
        });
      });
    }

    return {
      register: function (callback, task) {
        task = task ? task : 'global';
        if (listeners[task]) {
          listeners[task].push(callback);
        } else {
          listeners[task] = [callback];
        }

        callback(state[task].count > 0, function () {
          if (listeners[task].indexOf(callback) > 0) {
            listeners[task].splice(listeners[task].indexOf(callback), 1);
          }
        });
      },
      busy: function (task, detach) {
        task = task ? task : 'global';
        detach = detach ? true : false;
        if (state[task] && (state[task].count > 0) || task === 'global' && state[task].detached !== detach) {
          throw 'Unable to alter detachment status of ongoing task \'' + task + '\', was previously \'' + (state[task].detached ? 'detached' : 'attached') + '\'.';
        }

        if (task && task !== 'global') {
          if (!state[task]) {
            state[task] = { count: 0, detached: detach };
          }

          if (1 === (state[task].count += 1)) {
            notify(task);
          }
        }

        if (!state[task].detached && 1 === (state.global.count = state.global.count + 1)) {
          notify('global');
        }
      },
      done: function (task) {
        task = task ? task : 'global';
        if (task && task !== 'global') {
          if (!(state[task].count = state[task].count ? state[task].count - 1 : 0)) {
            notify(task);
          }
        }

        if (!state[task].detached && !(state.global.count = state.global.count ? state.global.count - 1 : 0)) {
          notify('global');
        }
      }
    };
  })
  .directive('busy', ['BusySvc', function (busySvc) {
    return {
      restrict: 'E',
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
          setTimeout(function () { scope.$apply(); }, 0);
        }, scope.task);
      }
    };
  }]);

module.exports = moduleName;
