// Service Worker for EduAdapt PWA
const CACHE_NAME = "eduadapt-pwa-v2";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/brand/icon-192.png",
  "/brand/icon-512.png"
];

// Install Event: Cache Core Static Assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event: Clean up outdated caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// API data and private media are per-user; caching them would show one account's data to the next
const NEVER_CACHE = [/^\/api\//, /^\/uploads\//];

// Fetch Event: Stale-While-Revalidate with SPA Fallback
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.headers.has("Authorization") || NEVER_CACHE.some((re) => re.test(url.pathname))) return;

  // For HTML navigation requests, try network first, then cache, fallback to index.html for SPA routes
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() =>
          caches.match(request)
            .then((cached) => cached || caches.match("/index.html"))
            .then((fallback) => fallback || Response.error())
        )
    );
    return;
  }

  // For static assets: Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
        }
        return networkResponse;
      });
      if (cachedResponse) {
        fetchPromise.catch(() => {});
        return cachedResponse;
      }
      return fetchPromise;
    })
  );
});
