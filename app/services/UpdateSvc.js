'use strict';
/*jshint camelcase: false*/

module.exports = function ($http, $q, apiSvc) {
  return {
    getMatrix: function (file, pageNumber, pageName) {
      var deferred = $q.defer();
      var formData = new FormData();
      formData.append('file', file);

      $http.post(apiSvc.updateEndpoint + 'parse?pageNumber=' + (pageNumber || '') + '&pageName=' + (pageName || ''), formData, {
        headers: {
          'Content-Type': undefined
        }
      }).success(function (data) {
        deferred.resolve(data);
      }).error(function (response) {
        deferred.reject(response);
      });

      return deferred.promise;
    },
    update: function (employees) {
      return apiSvc.post(apiSvc.updateEndpoint, employees);
    },
    deleteSite: function (site_pk) {
      return apiSvc.delete(encodeURI(apiSvc.updateEndpoint + 'sites/' + site_pk));
    },
    createSite: function (site_pk, site_name, site_dept_fk, site_notes, new_pk) {
      return apiSvc.put(encodeURI(apiSvc.updateEndpoint + 'sites/' + site_pk), {
        site_pk: new_pk || site_pk,
        site_name: site_name,
        site_dept_fk: site_dept_fk,
        site_notes: site_notes
      });
    },
    deleteCert: function (cert_pk) {
      return apiSvc.delete(encodeURI(apiSvc.updateEndpoint + 'certificates/' + cert_pk));
    },
    updateCert: function (cert_pk, cert_name, cert_short, cert_target, cert_permanentonly, new_pk) {
      return apiSvc.put(encodeURI(apiSvc.updateEndpoint + 'certificates/' + cert_pk), {
        cert_pk: new_pk || cert_pk,
        cert_name: cert_name,
        cert_short: cert_short,
        cert_target: cert_target,
        cert_permanentonly: cert_permanentonly
      });
    },
    deleteTrty: function (trty_pk) {
      return apiSvc.delete(encodeURI(apiSvc.updateEndpoint + 'trainingtypes/' + trty_pk));
    },
    updateTrty: function (trty_pk, trty_name, trty_validity, certificates) {
      return apiSvc.put(encodeURI(apiSvc.updateEndpoint + 'trainingtypes/' + trty_pk), {
        trty_name: trty_name,
        trty_validity: trty_validity,
        certificates: certificates
      });
    },
    deleteDept: function (dept_pk) {
      return apiSvc.delete(apiSvc.updateEndpoint + 'departments/' + dept_pk);
    },
    updateDept: function (dept_pk, dept_name, dept_id) {
      return apiSvc.put(apiSvc.updateEndpoint + 'departments/' + dept_pk, {
        dept_name: dept_name,
        dept_id: dept_id
      });
    }
  };
};
