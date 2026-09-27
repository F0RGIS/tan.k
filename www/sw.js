// Network-first so sprite and script updates show up immediately.
// The cache is only a fallback for offline play.
const CACHE = 'tank-v17';
const ASSETS = [
  './', './index.html', './style.css', './manifest.webmanifest',
  './js/font.js', './js/audio.js', './js/input.js', './js/levels.js', './js/sprites.js', './js/game.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(ASSETS.map(async url => {
      const res = await fetch(new Request(url, { cache: 'reload' }));
      if (!res.ok) throw new Error(url);
      await cache.put(url, res);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    try {
      const fresh = await fetch(e.request);
      if (fresh && fresh.ok && fresh.type === 'basic') {
        const cache = await caches.open(CACHE);
        cache.put(e.request, fresh.clone());
      }
      if (fresh) return fresh;
    } catch (err) { /* offline */ }
    const hit = await caches.match(e.request);
    if (hit) return hit;
    return new Response('', { status: 504, statusText: 'offline' });
  })());
});
