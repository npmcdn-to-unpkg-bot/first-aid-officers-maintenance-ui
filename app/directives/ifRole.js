'use strict';

var _ = require('lodash');

module.exports = function ($rootScope, ngIfDirective) {
  var ngIf = ngIfDirective[0];

  function asdf(roles, role) {
    if (_.startsWith(role, '!')) {
      return !_.includes(roles, role.substr(1));
    }

    return _.includes(roles, role);
  }

  function link($scope, element, attrs) {
    var shown = false;
    attrs.ngIf = function () {
      return shown;
    };

    ngIf.link.apply(ngIf, arguments);
    $rootScope.$watch('currentUser.info.roles', function (roles) {
      if (_.isArray($scope.roles)) {
        shown = _.every($scope.roles, function (role) {
          return asdf(roles, role);
        });
      } else {
        shown = asdf(roles, $scope.roles);
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
