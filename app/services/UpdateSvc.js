'use strict';
/*jshint camelcase: false*/

module.exports = function ($http, $q, apiSvc) {
  return {
    update: function (employees) {
      return apiSvc.post(apiSvc.updateEndpoint, employees);
    },
    deleteSite: function (site_pk) {
      return apiSvc.delete(encodeURI(apiSvc.updateEndpoint + 'sites/' + site_pk));
    },
    editSite: function (site) {
      return apiSvc.put(encodeURI(apiSvc.updateEndpoint + 'sites/' + (site.site_pk || site.new_pk)), {
        site_pk: site.new_pk || site.site_pk,
        site_name: site.site_name,
        site_dept_fk: site.site_dept_fk.toString(),
        site_notes: site.site_notes
      });
    },
    deleteDept: function (dept_pk) {
      return apiSvc.delete(apiSvc.updateEndpoint + 'departments/' + dept_pk);
    },
    editDept: function (dept) {
      return apiSvc.put(apiSvc.updateEndpoint + 'departments/' + dept.dept_pk, {
        dept_name: dept.dept_name,
        dept_id: dept.dept_id
      });
    },
    createDept: function (dept) {
      return apiSvc.post(apiSvc.updateEndpoint + 'departments', {
        dept_name: dept.dept_name,
        dept_id: dept.dept_id
      });
    },
    reorderCerts: function (certsOrder) {
      return apiSvc.post(apiSvc.updateEndpoint + 'certificates/reorder', certsOrder);
    },
    reorderTrtys: function (typesOrder) {
      return apiSvc.post(apiSvc.updateEndpoint + 'trainingtypes/reorder', typesOrder);
    },
    deleteCert: function (cert_pk) {
      return apiSvc.delete(apiSvc.updateEndpoint + 'certificates/' + cert_pk);
    },
    createCert: function (cert_name, cert_short, cert_target) {
      return apiSvc.post(apiSvc.updateEndpoint + 'certificates', {
        cert_name: cert_name,
        cert_short: cert_short,
        cert_target: cert_target,
        cert_permanentonly: true
      });
    },
    updateCert: function (cert_pk, cert_name, cert_short, cert_target) {
      return apiSvc.put(apiSvc.updateEndpoint + 'certificates/' + cert_pk, {
        cert_name: cert_name,
        cert_short: cert_short,
        cert_target: cert_target,
        cert_permanentonly: true
      });
    },
    deleteTrty: function (trty_pk) {
      return apiSvc.delete(apiSvc.updateEndpoint + 'trainingtypes/' + trty_pk);
    },
    createTrty: function (trty_name, trty_validity, certificates) {
      return apiSvc.post(apiSvc.updateEndpoint + 'trainingtypes', {
        trty_name: trty_name,
        trty_validity: trty_validity,
        certificates: certificates
      });
    },
    updateTrty: function (trty_pk, trty_name, trty_validity, certificates) {
      return apiSvc.put(apiSvc.updateEndpoint + 'trainingtypes/' + trty_pk, {
        trty_name: trty_name,
        trty_validity: trty_validity,
        certificates: certificates
      });
    }
  };
};
