/* 3EYE Jackpot service worker.
   HOW TO RELEASE: change VERSION every time you publish a new index.html (or any cached file).
   The page then shows "A new version is available. Update" and nobody is stuck on an old copy.
   This worker only handles same-site GET requests. It never touches the Apps Script API, the
   payment checkout, analytics or fonts, and it never caches POST requests. */
const VERSION = '2026-10-25-3';
const CORE = '3eye-core-' + VERSION;
const PRECACHE = ['./', 'index.html', 'manifest.webmanifest', 'assets/emblem-128.png'];

self.addEventListener('install', event => {
  /* No skipWaiting here on purpose: the new version waits until the member taps Update. */
  event.waitUntil(caches.open(CORE).then(c => Promise.all(PRECACHE.map(u => c.add(u).catch(() => {})))));
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('3eye-') && k !== CORE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;           // API, checkout, analytics and fonts go straight to the network

  /* Pages and live data: network first, so members get fresh content; the saved copy is only a fallback when offline. */
  const live = req.mode === 'navigate' || url.pathname.endsWith('/data/jackpots.json');
  if (live) {
    event.respondWith(
      fetch(req).then(res => {
        if (res && res.ok && req.mode === 'navigate') { const copy = res.clone(); caches.open(CORE).then(c => c.put('index.html', copy)); }
        return res;
      }).catch(() => caches.match(req.mode === 'navigate' ? 'index.html' : req, { ignoreSearch: true }).then(r => r || Response.error()))
    );
    return;
  }

  /* Static files (icons, manifest): serve the saved copy, refresh it in the background. */
  event.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => { if (res && res.ok) { const copy = res.clone(); caches.open(CORE).then(c => c.put(req, copy)); } return res; }).catch(() => hit);
      return hit || net;
    })
  );
});
