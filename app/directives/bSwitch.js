'use strict';

module.exports = function ($parse) {
  return {
    link: function ($scope, element, attrs) {
      var model = $parse(attrs.bswitch);
      var readonly = element.bootstrapSwitch('readonly');
      var switchChangeListener;
      if(attrs.bswitchChange) {
        switchChangeListener = $parse(attrs.bswitchChange);
      }

      if(!readonly) {
        element.on('switchChange.bootstrapSwitch', function (event, state) {
          model.assign($scope, state);
          if(switchChangeListener) {
            switchChangeListener($scope);
          }

          setTimeout(function () {$scope.$apply();}, 0);
        });
      }

      $scope.$watch(attrs.bswitch, function (value) {
        element.bootstrapSwitch('readonly', false);
        element.bootstrapSwitch('state', value);
        element.bootstrapSwitch('readonly', readonly);
      });
    }
  };
};