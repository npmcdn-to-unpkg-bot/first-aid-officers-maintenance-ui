'use strict';

module.exports = function () {
  return {
    restrict: 'A',
    scope: {
      state: '&loading',
      text: '@loadingText'
    },
    link: function (scope, element) {
      var _text = element.text();
      var _disabled;
      scope.$watch(scope.state, function (newValue, oldValue) {
        if(newValue !== oldValue) {
          if(scope.state()) {
            _disabled = element.prop('disabled');
            element.prop('disabled', true);
            element.text(scope.text);
          } else {
            element.prop('disabled', _disabled);
            element.text(_text);
          }
        }
      });
    }
  };
};