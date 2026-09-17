// Satyawati Traders Service Worker for Offline Caching and PWA Installation
const CACHE_NAME = 'satyawati-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Simple network-first strategy for dynamic billing app
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
