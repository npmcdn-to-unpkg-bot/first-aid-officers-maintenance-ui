'use strict';

function toDataUrl(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.responseType = 'blob';
  xhr.onload = function () {
    var reader = new FileReader();
    reader.onloadend = function () {
      callback(reader.result);
    }
    reader.readAsDataURL(xhr.response);
  };
  xhr.open('GET', url);
  xhr.send();
}

module.exports = function ($q, apiSvc) {
  return {
    getClientInfo: function () {
      return apiSvc.get(apiSvc.clientEndpoint);
    },
    getBase64Logo: function () {
      var defer = $q.defer();
      apiSvc.get(apiSvc.clientEndpoint).then(function (info) {
        /*jshint camelcase: false*/
        toDataUrl(info.clnt_logo, function (base64Img) {
          defer.resolve(base64Img);
        });
      }, function () {
        defer.reject('Could not retrieve client information.');
      });

      return defer.promise;
    }
  };
};
