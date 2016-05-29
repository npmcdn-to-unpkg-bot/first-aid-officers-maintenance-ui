'use strict';
/* jshint camelcase: false*/

var _ = require('lodash');
var helper = require('./trainingsSearchHelper.js');

module.exports = function ($rootScope, $scope, $location, ngDialog, busySvc, dataSvc) {
  $scope.searchType = 'formations';
  $scope.filter = {};
  $scope.display = {};
  $scope.comparisonOptions = helper.comparisonOptions;
  $scope.datesOptions = helper.datesOptions;

  function setSearchUrl() {
    $scope.filter = _.omitBy($scope.filter, function (value) {
      return value === false || value === null || _.isArray(value) && value.length === 0 || _.isObject(value) && _.keys(value).length === 0;
    });

    $location.search('filter', helper.toURIComponent($scope.filter)).replace();
    $location.search('display', helper.toURIComponent($scope.display)).replace();
  }

  $scope.search = function () {
    $location.path('/trainings/results');
  };

  $scope.steps = [{
    step: 1,
    title: 'Crit&egrave;res de recherche',
    template: 'components/search/trainings/trainings_search_step1.html'
  }, {
    step: 2,
    title: 'Param&egrave;tres d\'affichage',
    template: 'components/search/trainings/trainings_search_step2.html'
  }];
  $scope.currentStep = $scope.steps[0];

  busySvc.busy('trainingsSearch');
  Promise.all([dataSvc.getDepartments(), dataSvc.getCertificates(), dataSvc.getTrainingTypes()]).then(function (results) {
    $scope.departments = _.values(results[0]);
    $scope.trainingTypes = _.values(results[2]);
    $scope.filter = helper.fromURIComponent($location.search().filter);
    $scope.certificates = _.values(results[1]);
    $scope.display = helper.fromURIComponent($location.search().display);
    $scope.$watch('filter', setSearchUrl, true);
    $scope.$watch('display', setSearchUrl, true);
    busySvc.done('trainingsSearch');
  }, _.partial(busySvc.done, 'trainingsSearch'));

  $scope.addDatesFor = function (dateMode, params) {
    $scope.filter.date = _.extend({
      o: dateMode.value
    }, params);
  };

  $scope.addDates = function (dateMode) {
    var dialogScope = $scope.$new();
    dialogScope.dateMode = dateMode;
    dialogScope.params = {};
    dialogScope.isValid = function () {
      switch (dateMode.value) {
        case 'soon':
        case 'recent':
          return dialogScope.params.data > 0;
        case 'specific':
          return dialogScope.params.from && dialogScope.params.to && !isNaN(dialogScope.params.from.getTime()) && !isNaN(dialogScope.params.to.getTime());
      }
    };

    ngDialog.open({
      template: './components/dialogs/trainings_dates_selection.html',
      scope: dialogScope
    });
  };

  $scope.addTypesFor = function (certMode, data) {
    if (certMode) {
      $scope.filter.trtys = _.uniq(($scope.filter.trtys || []).concat(_.map(_.filter($scope.trainingTypes, function (trty) {
        return _.some(trty.certificates, function (cert) {
          return cert.cert_pk === data.cert_pk;
        });
      }), 'trty_pk'))).sort();
    } else {
      $scope.filter.trtys = _.uniq(_.union($scope.filter.trtys || [], [data.trty_pk])).sort();
    }
  };

  $scope.addTypes = function (certMode) {
    if (certMode !== null) {
      var dialogScope = $scope.$new();
      dialogScope.certMode = certMode;
      ngDialog.open({
        template: './components/dialogs/trainings_types_selection.html',
        scope: dialogScope
      });

      delete $scope.certMode;
    }
  };
};
