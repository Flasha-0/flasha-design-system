// sw.js
// ============================================================
// 🎴 Flasha Design Signature System — Service Worker v4.1
// ============================================================

'use strict';

const CACHE_NAME = 'flasha-v4.1';

const CACHE_URLS = [
  '/',
  '/index.html',
  '/your-styles.css',
  '/your-script.js',
  '/pwa.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://cdn.jsdelivr.net/gh/Flasha-0/flasha-design-system@main/flasha-styles.css',
  'https://cdn.jsdelivr.net/gh/Flasha-0/flasha-design-system@main/flasha-scripts.js',
];

/* ── Install: cache everything ────────────────────────────── */
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate: delete old caches ──────────────────────────── */
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME)
            .map((k)  => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* ── Fetch: cache-first, network fallback ─────────────────── */
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.startsWith('chrome-extension')) return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;

      return fetch(e.request)
        .then((response) => {
          if (
            !response ||
            response.status !== 200 ||
            response.type === 'opaque'
          ) {
            return response;
          }
          const clone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => cache.put(e.request, clone));
          return response;
        })
        .catch(() => {
          if (e.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
    })
  );
});