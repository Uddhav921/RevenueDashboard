// Import external Progressier script
importScripts("https://progressier.app/wDpYDhLBHTDMLE0rljkJ/sw.js");

const CACHE_NAME = 'solithix-v2';
const ASSETS = [
  './',
  './index.html',
  './pricing.html',
  './payment.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
  'https://checkout.razorpay.com/v1/checkout.js'
];

// Detect if running locally (Live Server or localhost)
const isLocalhost =
  self.location.hostname === 'localhost' ||
  self.location.hostname.startsWith('127.') ||
  self.location.hostname.startsWith('192.');

// =============================
// INSTALL EVENT (cache for production)
// =============================
self.addEventListener('install', (event) => {
  if (isLocalhost) {
    console.log('⚙️ Development mode: skipping cache install');
    return;
  }

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching app shell');
        return cache.addAll(ASSETS);
      })
      .catch((err) => console.error('❌ Cache addAll failed:', err))
  );
});

// =============================
// ACTIVATE EVENT (clear old caches)
// =============================
self.addEventListener('activate', (event) => {
  if (isLocalhost) {
    console.log('⚙️ Development mode: skipping cache cleanup');
    return;
  }

  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
});

// =============================
// FETCH EVENT
// =============================
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // ✅ Development mode: always fetch from network
  if (isLocalhost) {
    event.respondWith(fetch(event.request));
    return;
  }

  // ✅ Production mode: cache-first strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      const fetchRequest = event.request.clone();
      return fetch(fetchRequest).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    }).catch(() => {
      if (event.request.mode === 'navigate') {
        return caches.match('./offline.html');
      }
    })
  );
});
