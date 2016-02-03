'use strict';

module.exports = function ($parse) {
  /*jshint multistr: true*/
  return {
    restrict: 'E',
    require: '^stTable',
    scope: {
      collection: '=',
      predicate: '@',
      predicateExpression: '='
    },
    template:' \
      <div class="form-group"> \
        <div class="input-group full-width"> \
          <input class="form-control" ng-model="select" placeholder="Rechercher..." ng-change="optionChanged(select)" typeahead-editable="false" typeahead-on-select="optionChanged($item)" type="text" uib-typeahead="type for type in distinctItems | filter: $viewValue" /> \
        </div> \
      </div>',

    link: function(scope, element, attr, table) {
      var getPredicate = function() {
        var predicate = scope.predicate;
        if (!predicate && scope.predicateExpression) {
          predicate = scope.predicateExpression;
        }

        return predicate;
      };

      scope.$watch('collection', function(newValue) {
        var predicate = getPredicate();
        var parsed = $parse(predicate);

        if (newValue) {
          var temp = [];
          scope.collection.forEach(function(item) {
            var value = parsed(item);//item[predicate];
            if (value && value.length > 0 && temp.indexOf(value) === -1) {
              temp.push(value);
            }
          });

          temp.sort();
          scope.distinctItems = ['Tous'].concat(temp);
          scope.selectedOption = scope.distinctItems[0];
          scope.optionChanged(scope.selectedOption);
        }
      }, true);

      scope.optionChanged = function(selectedOption) {
        table.search((selectedOption !== 'Tous') ? selectedOption : '', getPredicate());
      };
    }
  };
};