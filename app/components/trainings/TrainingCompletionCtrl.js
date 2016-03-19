'use strict';
/*jshint camelcase: false*/

var _ = require('underscore');
var moment = require('moment');

module.exports = function ($scope, $rootScope, $routeParams, dataSvc, $location, ngDialog, trainingsSvc, busySvc, dateFilter) {
  busySvc.busy();

  Promise.all([dataSvc.getTraining($routeParams.trng_pk), dataSvc.getTrainingTypes(), dataSvc.getCertificates()]).then(function (results) {
    $scope.trng = results[0];
    $scope.firstTime = ($scope.trng.trng_outcome === 'SCHEDULED');
    $scope.trng.type = results[1][results[0].trng_trty_fk];
    $scope.trainees = _.values(results[0].trainees);
    $scope.certificates = _.values(results[2]);
    $scope.trng.expirationDate = moment($scope.trng.trng_date).add($scope.trng.type.trty_validity, 'months').format('YYYY-MM-DD');
    $scope.trng.validity = moment.duration($scope.trng.type.trty_validity, 'months').asYears();
    busySvc.done();
    $scope.$apply();
  }, function () {
    busySvc.done();
  });

  $scope.unregister = function (empl) {
    var dialogScope = $scope.$new();
    dialogScope.innerHtml = '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">d&eacute;sinscrire ' + (empl.empl_gender ? 'M.' : 'Mme') + ' ' + empl.empl_surname + ' ' + empl.empl_firstname + '</span> de cette formation&nbsp;?';
    ngDialog.openConfirm({
      template: 'components/dialogs/warning.html',
      scope: dialogScope
    }).then(function () {
      $scope.trainees.splice($scope.trainees.indexOf(empl), 1);
      delete $scope.trng.trainees[empl.empl_pk];
    });
  };

  $scope.getDisplayDate = function () {
    if ($scope.trng.trng_start) {
      var dateFromFormat;
      if (dateFilter($scope.trng.trng_start, 'yyyy') !== dateFilter($scope.trng.trng_date, 'yyyy')) {
        dateFromFormat = 'longDate';
      } else {
        dateFromFormat = dateFilter($scope.trng.trng_start, 'M') === dateFilter($scope.trng.trng_date, 'M') ? 'd' : 'd MMMM';
      }

      return 'du ' + dateFilter($scope.trng.trng_start, dateFromFormat) + ' au ' + dateFilter($scope.trng.trng_date, 'longDate');
    }

    return dateFilter($scope.trng.trng_date, 'fullDate');
  };

  $scope.validateAll = function () {
    _.each($scope.trainees, function (trainee) {
      trainee.validated = true;
    });
  };

  $scope.save = function () {
    var dialogScope = $scope.$new(true);
    var highlighted = $scope.firstTime ? '&eacute;diter le' : 'enregistrer les modifications apport&eacute;es au';
    dialogScope.innerHtml = '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning"> ' + highlighted + ' Proc&egrave;s&nbsp;Verbal</span> de cette formation&nbsp?';
    ngDialog.openConfirm({
      template: 'components/dialogs/warning.html',
      scope: dialogScope
    }).then(function () {
      trainingsSvc.updateTraining($scope.trng.trng_pk, {
        trng_trty_fk: $scope.trng.type.trty_pk,
        trng_start: $scope.trng.trng_start,
        trng_date: $scope.trng.trng_date,
        trng_outcome: 'COMPLETED',
        trng_comment: $scope.trng.trng_comment && $scope.trng.trng_comment.length > 0 ? $scope.trng.trng_comment : null,
        trainers: _.pluck($scope.trng.trainers, 'empl_pk'),
        trainees: _.each($scope.trng.trainees, function (trainee) {
          trainee.trem_outcome = trainee.validated ? 'VALIDATED' : 'FLUNKED';
        })
      }).then(function () {
        $rootScope.alerts.push({ type: 'success', msg: 'Proc&egrave;s verbal de fin de session &eacute;dit&eacute;.' });
        $location.path('/trainings/' + $scope.trng.trng_pk).search('force', true);
      });
    });
  };

  $scope.cancel = function () {
    var dialogScope = $scope.$new(true);
    var highlighted = $scope.firstTime ? 'l\'&eacute;dition' : 'la modification';
    dialogScope.innerHtml = '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">annuler ' + highlighted + ' du Proc&egrave;s&nbsp;Verbal</span> de cette formation&nbsp?<hr />En confirmant, toutes les modifications qui n\'ont pas &eacute;t&eacute; sauvegard&eacute;es seront perdues.';
    ngDialog.openConfirm({
      template: 'components/dialogs/warning.html',
      scope: dialogScope
    }).then(function () {
      $location.path('/trainings/' + $scope.trng.trng_pk).search('force', true);
    });
  };
};
