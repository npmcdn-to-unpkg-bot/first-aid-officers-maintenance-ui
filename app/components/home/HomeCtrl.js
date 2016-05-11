'use strict';

var _ = require('lodash');

module.exports = function ($scope, ngDialog, busySvc) {
  $scope.login = function () {
    ngDialog.closeAll();
    busySvc.busy('auth', true);
    ngDialog.open({
      template: 'components/index/login.html',
      controller: 'LoginCtrl',
      preCloseCallback: _.partial(busySvc.done, 'auth', true)
    });
  };

  return this;
};
