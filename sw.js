const CACHE_NAME = 'solithix-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/pricing.html',
  '/payment.html',
  '/style.css',
  '/script.js',
  // Add other assets you want to cache
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});