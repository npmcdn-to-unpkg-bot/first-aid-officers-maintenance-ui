'use strict';

var _ = require('lodash');

module.exports = function ($rootScope, ngIfDirective) {
  var ngIf = ngIfDirective[0];

  function testRole(roles, role) {
    var test = /(!)?([a-z]+)(\d)?$/.exec(role);
    var res = (function (roles, role, level) {
      return !_.isNil(roles[role]) && (level ? roles[role] >= level : true);
    })(roles, test[2], test[3]);

    return test[1] ? !res : !!res;
  }

  function link($scope, element, attrs) {
    var shown = false;
    attrs.ngIf = function () {
      return shown;
    };

    ngIf.link.apply(ngIf, arguments);
    $rootScope.$watch('currentUser.info.roles', function (roles) {
      if (roles) {
        if (_.isArray($scope.roles)) {
          shown = _.every($scope.roles, function (role) {
            return testRole(roles, role);
          });
        } else {
          shown = testRole(roles, $scope.roles);
        }
      }
    });
  }

  return {
    scope: {
      roles: '=ifRole'
    },
    priority: ngIf.priority,
    restrict: ngIf.restrict,
    terminal: ngIf.terminal,
    transclude: ngIf.transclude,
    link: link
  };
};
