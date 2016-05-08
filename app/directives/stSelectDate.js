'use strict';

module.exports = function (dateFilter) {
  /*jshint multistr: true*/
  return {
    restrict: 'E',
    require: '^stTable',
    scope: {
      predicate: '@',
      predicateExpression: '='
    },
    template: ' \
      <form class="form-group" autocomplete="off"> \
        <div class="input-group full-width"> \
          <input id="date" type="text" ng-model="viewDate" placeholder="Rechercher..." class="form-control" uib-datepicker-popup="dd/MM/yyyy" \
          datepicker-mode="\'month\'" is-open="datepicker" show-button-bar="false" starting-day="1" show-weeks="false" /> \
          <div class="input-group-btn">\
            <button type="button" class="btn btn-default" ng-click="datepicker=true" style="padding: 8px 12px;"><span class="glyphicon glyphicon-calendar"></span></button>\
          </div>\
        </div> \
      </form>',
    link: function (scope, element, attr, table) {
      var getPredicate = function () {
        var predicate = scope.predicate;
        if (!predicate && scope.predicateExpression) {
          predicate = scope.predicateExpression;
        }

        return predicate;
      };

      scope.$watch('viewDate', function (dateStr) {
        var date = new Date(dateStr);
        if (dateStr === null) {
          table.search('', getPredicate());
        } else if (Object.prototype.toString.call(date) === '[object Date]' && !isNaN(date.getTime())) {
          table.search(dateFilter(date, 'yyyy-MM-dd'), getPredicate());
        }
      });
    }
  };
};
