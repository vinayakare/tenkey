/* 10-Key service worker — cache-first shell with network-first navigation.
   Bump CACHE (v1 → v2) whenever you change files to push updates to users. */
const CACHE = 'tenkey-v1';
const ASSETS = ['./', './index.html', './manifest.json',
  './icon-192.png', './icon-512.png', './icon-180.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(ASSETS.map(u => c.add(u).catch(() => {}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  /* navigations: network first, cache fallback → updates arrive, offline still works */
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(c => c.put('./index.html', copy));
      return resp;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  /* everything else: cache first, then network (and cache the result) */
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(resp => {
    if (resp && resp.ok) {
      const cp = resp.clone();
      caches.open(CACHE).then(c => c.put(req, cp));
    }
    return resp;
  })));
});