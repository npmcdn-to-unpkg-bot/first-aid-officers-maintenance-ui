'use strict';
/*jshint camelcase: false*/

module.exports = function (apiSvc) {
  return {
    setNotes: function (empl_pk, notes) {
      return apiSvc.put(apiSvc.employeesNotesEndpoint + empl_pk, { empl_notes: notes });
    },
    sstOptOut: function (empl_pk) {
      return apiSvc.post(apiSvc.employeesNotesEndpoint + empl_pk + '/sst-optout');
    },
    sstOptIn: function (empl_pk) {
      return apiSvc.delete(apiSvc.employeesNotesEndpoint + empl_pk + '/sst-optout');
    }
  };
};
