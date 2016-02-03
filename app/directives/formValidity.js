'use strict';

module.exports = function () {
  return {
    require: 'ngModel',
    restrict: 'A',
    scope: {
      condition: '=formValidity'
    },
    link: function (scope, element, attrs, ngModel) {
      scope.$watch('condition', function (validity) {
        if(attrs.required) {
          validity = validity || false;
        }

        ngModel.$setValidity('formValidity', validity);
      });
    }
  };
};