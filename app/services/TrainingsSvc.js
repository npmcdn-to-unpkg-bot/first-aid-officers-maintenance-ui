'use strict';
/*jshint camelcase: false*/

module.exports = function ($http, $q, apiSvc) {
	return {
		createTraining: function (training) {
			var deferred = $q.defer();
			$http.post(apiSvc.trainingsEndpoint, JSON.stringify(training), {
				headers: {
					'Content-Type': 'application/json'
				}
			}).success(function (trng_pk) {
				deferred.resolve(trng_pk);
			}).error(function (error) {
				console.log(error);
			});

			return deferred.promise;
		},
		updateTraining: function (trng_pk, training) {
			var deferred = $q.defer();
			$http.put(apiSvc.trainingsEndpoint + trng_pk, JSON.stringify(training), {
				headers: {
					'Content-Type': 'application/json'
				}
			}).success(function () {
				deferred.resolve();
			}).error(function (error) {
				console.log(error);
			});

			return deferred.promise;
		},
		deleteTraining: function (trng_pk) {
			var deferred = $q.defer();
			$http.delete(apiSvc.trainingsEndpoint + trng_pk).success(function () {
				deferred.resolve();
			}).error(function (error) {
				console.log(error);
			});

			return deferred.promise;
		}
	};
};
