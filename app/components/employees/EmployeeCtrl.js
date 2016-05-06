'use strict';
/*jshint camelcase: false*/

var _ = require('lodash');
var moment = require('moment');

module.exports = function ($rootScope, $scope, $routeParams, dataSvc, adminSvc, $location, ngDialog, $route, busySvc, EmployeesNotesSvc) {
  busySvc.busy();

  Promise.all([dataSvc.getEmployee($routeParams.empl_pk), dataSvc.getEmployeeTrainings($routeParams.empl_pk), dataSvc.getTrainingTypes(), dataSvc.getCertificates(),
    dataSvc.getEmployeeSite($routeParams.empl_pk), dataSvc.getEmployeeCertificatesVoiding($routeParams.empl_pk)
  ]).then(function (results) {
    $scope.empl = results[0];
    $scope.source = _.values(results[1]);
    _.each($scope.source, function (training) {
      training.type = results[2][training.trng_trty_fk];
    });
    $scope.certificates = _.values(results[3]);
    $scope.site = results[4];
    $scope.certificatesVoiding = _.each(results[5], function (voiding) {
      voiding.cert = results[3][voiding.emce_cert_fk];
      voiding.date = new Date(voiding.emce_date);
    });

    if ($scope.empl.empl_pk !== $rootScope.currentUser.info.empl_pk) {
      adminSvc.getUserInfo($scope.empl.empl_pk).then(function (info) {
        $scope.canResetPassword = info.roles.indexOf('user') !== -1;
      });
    }

    busySvc.done();
    $scope.$apply();
  }, function () {
    busySvc.done();
  });

  $scope.editNotes = function () {
    var dialogScope = $scope.$new(false);
    dialogScope.callback = function (notes, closeThisDialog) {
      EmployeesNotesSvc.setNotes($scope.empl.empl_pk, notes).then(function () {
        closeThisDialog();
        $route.reload();
        $rootScope.alerts.push({ type: 'success', msg: 'Notes mises &agrave; jour.' });
      });
    };

    ngDialog.open({
      scope: dialogScope,
      template: 'components/dialogs/edit_notes.html'
    });
  };

  $scope.addVoiding = function () {
    var dialogScope = $scope.$new();
    dialogScope.callback = function (optout, cert, date) {
      var dialogScope = $scope.$new();
      var empl_display = ($scope.empl.empl_gender ? 'M.' : 'Mme') + ' ' + $scope.empl.empl_surname + ' ' + $scope.empl.empl_firstname;
      dialogScope.innerHtml = optout ?
        'Exclure un agent d\'un certain dispositif rend son aptitude correspondante <span class="text-warning">invalide</span> &agrave; compter de la date de sortie.<hr />' :
        '';

      dialogScope.innerHtml += '&Ecirc;tes-vous s&ucirc;r(e) de vouloir ' + '<span class="text-warning">' + (optout ? 'sortir ' + empl_display + '</span><br /> du ' :
        'r&eacute;int&eacute;grer ' + empl_display + '</span><br /> dans le') + ' <span class="text-warning">dispositif ' + cert.cert_short + '</span>' + (optout ?
        ' &agrave; compter du ' + moment(date).format('Do MMMM YYYY') : '') + ' ?';

      ngDialog.openConfirm({
        template: 'components/dialogs/warning.html',
        scope: dialogScope
      }).then(function () {
        ngDialog.closeAll();
        if (optout) {
          EmployeesNotesSvc.optOut($scope.empl.empl_pk, cert.cert_pk, date).then(function () {
            $route.reload();
            $rootScope.alerts.push({
              type: 'success',
              msg: empl_display + ' a &eacute;t&eacute; sorti(e) du dispositif ' + cert.cert_short + '.'
            });
          });
        } else {
          EmployeesNotesSvc.optIn($scope.empl.empl_pk, cert.cert_pk).then(function () {
            $route.reload();
            $rootScope.alerts.push({
              type: 'success',
              msg: empl_display + ' a r&eacute;int&eacute;gr&eacute; le dispositif ' + cert.cert_short + '.'
            });
          });
        }
      });
    };

    dialogScope.availableVoidings = _.differenceBy($scope.certificates, $scope.certificatesVoiding, function (cert) {
      return cert.cert_pk || cert.emce_cert_fk;
    });

    dialogScope.currentVoidings = _.intersectionBy($scope.certificates, $scope.certificatesVoiding, function (cert) {
      return cert.cert_pk || cert.emce_cert_fk;
    });

    dialogScope.isValid = function (optout, cert, date) {
      if (optout) {
        return Object.prototype.toString.call(date) === "[object Date]" && !isNaN(date.getTime()) && cert;
      }

      return cert;
    };

    ngDialog.open({
      template: 'components/dialogs/employee_voiding.html',
      scope: dialogScope
    });
  };

  $scope.editRoles = function () {
    adminSvc.getUserRoles($scope.empl.empl_pk).then(function (roles) {
      var dialogScope = $scope.$new(false);
      dialogScope.roles = _.object(_.pluck(roles, 'role_name'), roles);
      dialogScope.callback = function (empl) {
        $route.reload();
        if (empl.empl_pk === $rootScope.currentUser.info.empl_pk) {
          adminSvc.getInfo().then(null, function () {
            ngDialog.openConfirm({
              template: 'components/dialogs/locked_out.html'
            }).then(function () {
              $rootScope.disconnect();
            });
          });
        }
      };

      ngDialog.open({
        template: 'components/dialogs/roles_edit/roles_edit.html',
        scope: dialogScope,
        controller: 'RolesEditCtrl'
      });
    });
  };

  $scope.resetPassword = function () {
    var dialogScope = $scope.$new(true);
    dialogScope.innerHtml =
      '&Ecirc;tes-vous s&ucirc;r(e) de vouloir <span class="text-warning">r&eacute;initialiser le mot de passe</span> de cet agent&nbsp;? Cette modification est irr&eacute;versible et prend effet imm&eacute;diatement.';
    ngDialog.openConfirm({
      template: 'components/dialogs/warning.html',
      scope: dialogScope
    }).then(function () {
      adminSvc.resetUserPassword($scope.empl.empl_pk).then(function (password) {
        $rootScope.alerts.push({
          type: 'success',
          msg: 'Mot de passe r&eacute;initialis&eacute;&nbsp: <strong><samp>' + password +
            '</samp></strong><hr />Veuillez transmettre son nouveau mot de passe &agrave; l\'agent concern&eacute;.'
        });
      });
    });
  };

  $scope.selectTraining = function (trng_pk) {
    $location.path('/trainings/' + trng_pk);
  };

  $scope.select = function (empl_pk) {
    $location.path('/employees/' + empl_pk);
  };
};
