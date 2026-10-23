/* 3EYE Jackpot service worker. It only exists so phones can install the site as an app.
   It caches NOTHING: every page and every request goes straight to the network, so members always get the
   latest site and live account data. If the phone is offline it shows a short message instead of a blank page. */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function (e) {
  if (e.request.mode !== 'navigate') return;   // API calls, images, fonts and scripts are left alone
  e.respondWith(fetch(e.request).catch(function () {
    return new Response('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="background:#04120b;color:#f7dc7a;font:16px sans-serif;text-align:center;padding:40px">You are offline. Reconnect and open 3EYE Jackpot again.</body>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }));
});
