'use strict';

function toDataUrl(src, callback, outputFormat) {
  // Create an Image object
  var img = new Image();
  // Add CORS approval to prevent a tainted canvas
  img.crossOrigin = 'Anonymous';
  img.onload = function () {
    var canvas = document.createElement('CANVAS');
    var ctx = canvas.getContext('2d');
    var dataURL;
    // Resize the canavas to the image dimensions
    canvas.height = this.height;
    canvas.width = this.width;
    ctx.drawImage(this, 0, 0);
    dataURL = canvas.toDataURL(outputFormat);
    callback(dataURL);
    // Mark for garbage collection
    canvas = null;
  };

  img.src = src;
  // make sure the load event fires for cached images too
  if (img.complete || img.complete === undefined) {
    // Flush cache
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
    // Try again
    img.src = src;
  }
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
