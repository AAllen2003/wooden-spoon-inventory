// The Wooden Spoon — Service Worker v3
const CACHE = 'ws-inv-v3';

self.addEventListener('install', e => {
  // Skip waiting immediately so new SW takes control right away
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll([
      '/wooden-spoon-inventory/',
      '/wooden-spoon-inventory/index.html',
      '/wooden-spoon-inventory/manifest.json',
      '/wooden-spoon-inventory/icon-192.png',
      '/wooden-spoon-inventory/icon-512.png',
    ]).catch(() => {}))
  );
});

self.addEventListener('activate', e => {
  // Delete ALL old caches
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Always network-first for HTML so new versions load immediately
  if (url.includes('index.html') || url.endsWith('/wooden-spoon-inventory/') || url.endsWith('/wooden-spoon-inventory')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // Network-first for API calls
  if (url.includes('supabase') || url.includes('squareup') || url.includes('workers.dev') || url.includes('fonts.')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  // Cache-first for static assets (icons, manifest)
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }))
  );
});
