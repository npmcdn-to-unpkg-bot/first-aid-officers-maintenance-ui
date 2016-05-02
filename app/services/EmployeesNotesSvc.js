'use strict';
/*jshint camelcase: false*/

module.exports = function (apiSvc, dateFilter) {
  return {
    setNotes: function (empl_pk, notes) {
      return apiSvc.put(apiSvc.employeesNotesEndpoint + empl_pk, { empl_notes: notes });
    },
    optOut: function (empl_pk, cert_pk, date) {
      return apiSvc.post(apiSvc.employeesNotesEndpoint + empl_pk + '/optout?cert_pk=' + cert_pk + '&date=' + dateFilter(date, 'yyyy-MM-dd'));
    },
    optIn: function (empl_pk, cert_pk) {
      return apiSvc.delete(apiSvc.employeesNotesEndpoint + empl_pk + '/optout?cert_pk=' + cert_pk);
    }
  };
};
