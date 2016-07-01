'use strict';

var _ = require('lodash');

module.exports = function ($cookies) {
  function link(scope) {
    var ready = false;
    scope.$watch('items', function (items) {
      if (ready) {
        $cookies.putObject('stateSustain-' + scope.stateId, items);
      } else if (items) {
        ready = true;
        _.each(scope.items, function (item) {
          var found = _.find($cookies.getObject('stateSustain-' + scope.stateId) || {}, function (cookieItem) {
            return cookieItem[scope.itemsId] === item[scope.itemsId];
          });

          if (found) {
            item[scope.state] = found[scope.state];
          }
        });
      }
    }, true);
  }

  return {
    restrict: 'EA',
    scope: {
      items: '=',
      itemsId: '@',
      state: '@',
      stateId: '@',
    },
    link: link
  };
};
