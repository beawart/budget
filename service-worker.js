const CACHE_NAME = 'plansurf-budget-shell-v1';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './register-service-worker.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('plansurf-budget-shell-') && cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  if (event.request.method !== 'GET' || requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => (
        (await caches.match('./index.html')) || Response.error()
      ))
    );
    return;
  }

  const cachedAsset = APP_SHELL.some((path) => new URL(path, self.location.href).pathname === requestUrl.pathname);
  if (!cachedAsset) return;

  event.respondWith(
    fetch(event.request).then((response) => {
      if (response.ok) {
        const responseCopy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseCopy)));
      }
      return response;
    }).catch(async () => (await caches.match(event.request)) || Response.error())
  );
});
