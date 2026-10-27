/* ==========================================================================
   Church Media Studio Service Worker
   Built by Phosters Ministries
   Enables 100% offline Progressive Web App (PWA) operation
   ========================================================================== */

const CACHE_NAME = 'cms-phosters-v2';

const STATIC_ASSETS = [
  './',
  './index.html',
  './photo.html',
  './quotes.html',
  './audio.html',
  './landing.html',
  './css/style.css',
  './js/zip.js',
  './js/state.js',
  './js/renderer.js',
  './js/app.js',
  './js/quotes.js',
  './js/quotes-ui.js',
  './js/lame.min.js',
  './js/audio-tagger.js',
  './js/audio-engine.js',
  './js/audio-studio.js',
  './js/suite-hub.js',
  './assets/logo-app-icon.png',
  './assets/logo-adobe-cm.svg',
  './assets/logo-ph.svg',
  './assets/logo-rh.svg',
  './assets/logo-au.svg',
  './assets/logo-lt.svg',
  './assets/logo-sl.svg',
  './assets/logo-rd.svg',
  './assets/logo-horizontal.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-maskable-512.png',
  './favicon.png',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
