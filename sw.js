/* =================================================================
   Harvest Deli — Service Worker
   Cache-first for static assets, network-first for HTML pages.
   ================================================================= */
const VERSION = 'hd-v11';
const STATIC_CACHE = 'hd-static-' + VERSION;
const PAGE_CACHE = 'hd-pages-' + VERSION;

// Static assets cached eagerly on install
const PRECACHE = [
  '/',
  '/shared.css',
  '/legal.css',
  '/shared.js',
  '/favicon.svg',
  '/site.webmanifest',
  '/assets/menu-background.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(PRECACHE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== STATIC_CACHE && k !== PAGE_CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  // Only handle GET
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Skip cross-origin (fonts, third-party) — let network handle directly
  if (url.origin !== self.location.origin) return;

  // HTML — network first, fall back to cache, then offline page
  if (req.headers.get('accept') && req.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(PAGE_CACHE).then(c => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then(cached => cached || caches.match('/404.html')))
    );
    return;
  }

  // Static assets (css/js/img/font/video) — cache first, network fallback, then store
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const copy = res.clone();
        caches.open(STATIC_CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => cached);
    })
  );
});
