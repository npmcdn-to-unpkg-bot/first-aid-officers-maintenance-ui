'use strict';
/*jshint camelcase: false*/

module.exports = function ($http, $q, apiSvc) {
	var updateSvc = {};

	updateSvc.getMatrix = function (file, pageNumber, pageName) {
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
	};

	updateSvc.update = function (employees) {
		var deferred = $q.defer();
		$http.post(apiSvc.updateEndpoint, JSON.stringify(employees))
			.success(function (data) {
				deferred.resolve(data);
			})
			.error(function (error) {
				deferred.reject(error);
			});
			
		return deferred.promise;
	};

	updateSvc.deleteSite = function (site_pk) {
		var deferred = $q.defer();
		$http.delete(encodeURI(apiSvc.updateEndpoint + 'sites/' + site_pk))
			.success(function (data) {
				deferred.resolve(data);
			}).error(function (response) {
				deferred.reject(response);
			});

		return deferred.promise;
	};

	updateSvc.createSite = function (site_pk, site_name, site_dept_fk, new_pk) {
		var deferred = $q.defer();
		$http.put(encodeURI(apiSvc.updateEndpoint + 'sites/' + site_pk), JSON.stringify({
			site_pk: new_pk || site_pk,
			site_name: site_name,
			site_dept_fk: site_dept_fk
		}), {
			headers: {
				'Content-Type': 'application/json'
			}
		}
		).success(function (data) {
			deferred.resolve(data);
		}).error(function (response) {
			deferred.reject(response);
		});

		return deferred.promise;
	};

	updateSvc.deleteDept = function (dept_pk) {
		var deferred = $q.defer();
		$http.delete(apiSvc.updateEndpoint + 'departments/' + dept_pk)
			.success(function (data) {
				deferred.resolve(data);
			}).error(function (response) {
				deferred.reject(response);
			});
			
		return deferred.promise;
	};

	updateSvc.createDept = function (dept_pk, dept_name, dept_id) {
		var deferred = $q.defer();
		$http.put(apiSvc.updateEndpoint + 'departments/' + dept_pk, JSON.stringify({
			dept_name: dept_name,
			dept_id: dept_id
		}), {
			headers: {
				'Content-Type': 'application/json'
			}
		}
		).success(function (data) {
			deferred.resolve(data);
		}).error(function (response) {
			deferred.reject(response);
		});

		return deferred.promise;
	};

	return updateSvc;
};
