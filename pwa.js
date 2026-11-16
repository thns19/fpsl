(function () {
  if (!('serviceWorker' in navigator)) return;

  const isSecureOrigin = window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';
  if (!isSecureOrigin) return;

  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./service-worker.js').catch(function (error) {
      console.error('Unable to register the service worker:', error);
    });
  });
})();
