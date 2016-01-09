'use strict';

var _ = require('underscore');

module.exports = function ($rootScope, ngIfDirective) {
  var ngIf = ngIfDirective[0];

  function link ($scope, element, attrs) {
    var shown = false;
    attrs.ngIf = function () {
	    return shown;
    };
    
    ngIf.link.apply(ngIf, arguments);
    $rootScope.$watch('currentUser.info.roles', function (roles) {
	    if(attrs.ifRole.indexOf('!') === 0) {
	      shown = !_.contains(roles, attrs.ifRole.substr(1));
      } else {
        shown = _.contains(roles, attrs.ifRole);
	    }
    });
  }

  return {
    priority: ngIf.priority,
    restrict: ngIf.restrict,
    terminal: ngIf.terminal,
    transclude: ngIf.transclude,
    link: link
  };
};