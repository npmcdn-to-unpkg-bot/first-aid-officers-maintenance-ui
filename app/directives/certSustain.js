'use strict';

var _ = require('lodash');

module.exports = function (adminSvc) {

  function link(scope) {
    var ready = false;
    var relevant;

    function watch(certificates) {
      if (ready) {
        adminSvc.setRelevantCertificates(_(certificates).filter('checked').map('cert_pk').value());
      } else if (certificates) {
        _.each(certificates, function (cert) {
          if (_.includes(relevant, cert.cert_pk)) { //jshint ignore: line
            cert.checked = true;
          }
        });

        ready = true;
      }
    }

    adminSvc.getRelevantCertificates().then(function (data) {
      relevant = data;
      scope.$watch('certificates', watch, true);
    });
  }

  return {
    restrict: 'EA',
    scope: {
      certificates: '=items'
    },
    link: link
  };
};
