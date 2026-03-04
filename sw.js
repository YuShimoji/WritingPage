const APP_VERSION = '0.3.28';
const CACHE_NAME = `zenwriter-shell-v${APP_VERSION}`;
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/manifest.webmanifest',
  '/favicon.svg',
];

// 開発環境の検出（localhost または file:// プロトコル）
const isDev = self.location.hostname === 'localhost' ||
              self.location.hostname === '127.0.0.1' ||
              self.location.protocol === 'file:';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // 開発モードではネットワーク優先、本番モードではキャッシュ優先
  if (isDev) {
    // ネットワーク優先戦略（開発用）
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (!res || res.status !== 200 || res.type !== 'basic') return res;
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('/index.html')))
    );
  } else {
    // キャッシュ優先戦略（本番用）
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((res) => {
            if (!res || res.status !== 200 || res.type !== 'basic') return res;
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
            return res;
          })
          .catch(() => caches.match('/index.html'));
      })
    );
  }
});
