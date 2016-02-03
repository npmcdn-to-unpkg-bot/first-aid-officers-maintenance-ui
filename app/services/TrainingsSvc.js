'use strict';
/*jshint camelcase: false*/

module.exports = function (apiSvc) {
	return {
		createTraining: function (training) {
			return apiSvc.post(apiSvc.trainingsEndpoint, training);
		},
		updateTraining: function (trng_pk, training) {
			return apiSvc.put(apiSvc.trainingsEndpoint + trng_pk, training);
		},
		deleteTraining: function (trng_pk) {
			return apiSvc.delete(apiSvc.trainingsEndpoint + trng_pk);
		}
	};
};
