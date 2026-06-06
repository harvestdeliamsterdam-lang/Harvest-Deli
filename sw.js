/* =================================================================
   Harvest Deli — Service Worker (SELF-DESTRUCT / KILL-SWITCH)
   -----------------------------------------------------------------
   The previous cache-first service worker kept serving stale
   shared.js / shop.html during development, which made edits appear
   to "not change". This version exists only to remove that worker
   and all of its caches, then unregister itself and reload open
   tabs so the browser fetches everything fresh from the network.

   The browser always re-checks /sw.js on navigation (bypassing the
   SW cache), so shipping this file is what actually clears the jam.

   To re-enable real PWA/offline caching later, restore a versioned
   cache-first worker and re-enable registration in shared.js.
   ================================================================= */

self.addEventListener('install', () => {
  // Take over immediately instead of waiting for old worker to be released.
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // 1. Delete every cache this origin has.
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));

    // 2. Unregister this worker so future loads hit the network directly.
    try { await self.registration.unregister(); } catch (e) {}

    // 3. Force every open tab to reload fresh (now uncontrolled).
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(c => { try { c.navigate(c.url); } catch (e) {} });
  })());
});

// Pass-through: never serve from cache while the kill-switch is active.
self.addEventListener('fetch', () => { /* let the network handle everything */ });
