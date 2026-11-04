/* A interface pode abrir offline; voz, login e dados nunca são armazenados no cache. */
const CACHE = 'catty-shell-v1';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/catty.png', '/pcm-capture.js'];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('catty-shell-') && key !== CACHE).map((key) => caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || request.headers.has('authorization')) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then((cache) => cache.put('/index.html', copy)));
      }
      return response;
    }).catch(() => caches.match('/index.html')));
    return;
  }
  if (!/\.(?:js|css|png|webp|svg|woff2?)$/i.test(url.pathname)) return;
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok && response.type === 'basic') {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)));
    }
    return response;
  })));
});
