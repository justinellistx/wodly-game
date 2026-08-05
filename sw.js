/* Minimal service worker — satisfies PWA installability (network passthrough, no caching). */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => { /* passthrough: let the browser handle every request */ });
