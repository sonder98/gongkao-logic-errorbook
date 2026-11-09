/* 公考学习 PWA service worker
 * First-party app/data requests are network-first. The existing JSON fetches
 * still use cache:'no-cache'; this worker only refreshes the offline fallback.
 */
const CACHE_PREFIX = 'gongkao-pwa-';
const CACHE_VERSION = 'v2';
const SHELL_CACHE = CACHE_PREFIX + CACHE_VERSION + '-shell';
const DATA_CACHE = CACHE_PREFIX + CACHE_VERSION + '-data';
const APP_BASE = new URL(self.registration.scope);

const SHELL_FILES = [
  './',
  './index.html',
  './data-analysis.css',
  './data-analysis.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

const DATA_FILES = [
  './questions.json',
  './knowledge.json',
  './formal-questions.json',
  './formal-knowledge.json',
  './data-materials.json',
  './data-questions.json',
  './data-knowledge.json'
];

function absoluteUrl(path) {
  return new URL(path, APP_BASE).href;
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const shellCache = await caches.open(SHELL_CACHE);
    await shellCache.addAll(SHELL_FILES.map(path => new Request(absoluteUrl(path), { cache: 'reload' })));

    // Preload the current data snapshot for first-launch offline use.
    // Future successful JSON requests are also cached by the fetch handler.
    const dataCache = await caches.open(DATA_CACHE);
    await Promise.all(DATA_FILES.map(async path => {
      const request = new Request(absoluteUrl(path), { cache: 'no-cache' });
      try {
        const response = await fetch(request);
        if (response.status === 200) await dataCache.put(request, response.clone());
      } catch (_) {
        // A data file that cannot be fetched during installation can still be
        // retrieved and cached the next time the app is online.
      }
    }));

    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL_CACHE, DATA_CACHE]);
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => name.startsWith(CACHE_PREFIX) && !keep.has(name))
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function networkFirst(request) {
  const url = new URL(request.url);
  const cacheName = url.pathname.endsWith('.json') ? DATA_CACHE : SHELL_CACHE;
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.status === 200) await cache.put(request, response.clone());
    return response;
  } catch (_) {
    const cached = await cache.match(request) || await caches.match(request);
    if (cached) return cached;

    if (request.mode === 'navigate') {
      const shellCache = await caches.open(SHELL_CACHE);
      const fallback = await shellCache.match(absoluteUrl('./'))
        || await shellCache.match(absoluteUrl('./index.html'));
      if (fallback) return fallback;
    }

    return new Response('当前处于离线状态，且该资源尚未缓存。请联网后重新打开。', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const scopePath = new URL(self.registration.scope).pathname;
  if (url.origin !== self.location.origin || !url.pathname.startsWith(scopePath)) return;

  // Network-first means new questions/notes are fetched from Pages immediately;
  // Cache Storage is only the offline fallback, never the online source of truth.
  event.respondWith(networkFirst(request));
});
