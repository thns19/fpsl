const CACHE_NAME = 'pitchball-fantasy-v1';
const APP_SHELL = [
  './',
  './index.html',
  './fantasy-build.html',
  './fantasy-leaderboard.html',
  './fantasy-players.html',
  './fantasy-admin.html',
  './manifest.webmanifest',
  './fantasy-style.css',
  './fantasy-data.js',
  './fantasy-app.js',
  './fantasy-account-sync.js',
  './pwa.js',
  './pitchball%20fantasy.png',
  './icons/pitchball-192.png',
  './icons/pitchball-512.png',
  './logos/ac.png',
  './logos/alimou.png',
  './logos/axtar.png',
  './logos/badiles.png',
  './logos/basement.png',
  './logos/ex7t.png',
  './logos/gb.png',
  './logos/hitters.png',
  './logos/hornets.png',
  './logos/ksades.png',
  './logos/lpc.png',
  './logos/midi.png',
  './logos/polo.png',
  './logos/r1.png',
  './logos/spasmena.png',
  './logos/thryloi.png',
  './logos/ttd.png',
  './logos/volos.png',
  './logos/warriors.png',
  './photos/aris-tsertos-removebg-preview.png',
  './photos/dimitris-gavalas-removebg-preview.png',
  './photos/giorgos-karamolegkos-removebg-preview.png',
  './photos/johan-pilichos-removebg-preview.png',
  './photos/thanos-chatziiordanou-removebg-preview.png',
  './photos/tzannis-mermigas-removebg-preview.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(APP_SHELL);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (cacheNames) {
        return Promise.all(cacheNames
          .filter(function (cacheName) {
            return cacheName.startsWith('pitchball-fantasy-') && cacheName !== CACHE_NAME;
          })
          .map(function (cacheName) {
            return caches.delete(cacheName);
          }));
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', function (event) {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(function (response) {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              return cache.put(request, copy);
            });
          }
          return response;
        })
        .catch(function () {
          return caches.match(request).then(function (cachedPage) {
            return cachedPage || caches.match('./index.html');
          });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(function (cachedResponse) {
      if (cachedResponse) return cachedResponse;
      return fetch(request).then(function (response) {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            return cache.put(request, copy);
          });
        }
        return response;
      });
    })
  );
});
