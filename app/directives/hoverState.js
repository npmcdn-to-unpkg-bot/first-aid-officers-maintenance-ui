'use strict';

var _ = require('lodash');

module.exports = function ($parse) {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var _scope = attrs.hoverState.indexOf('$parent') === 0 ? $parse(/\$parent(\.\$parent)*/.exec(attrs.hoverState)[0])(scope) : scope;
      var set = _.partial($parse(attrs.hoverState).assign, scope);
      var getIf = _.partial($parse(attrs.hoverStateIf || 'true'), scope);

      element.on('mouseenter', function () {
        if (getIf()) {
          set(true);
          _scope.$digest();
        }
      });

      element.on('mouseleave', function () {
        if (getIf()) {
          set(false);
          _scope.$digest();
        }
      });
    }
  };
};
