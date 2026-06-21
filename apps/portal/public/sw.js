/*
 * Leavicy Portal service worker — offline support.
 *
 * Strategy (same-origin GET only):
 *   - /_next/static/*  → cache-first (content-hashed, immutable)
 *   - navigations & RSC fetches → network-first, fall back to cache, then /offline
 *   - other GETs (images, icons, fonts) → stale-while-revalidate
 *
 * Cross-origin requests (e.g. Supabase API/auth) and non-GET requests are
 * passed straight through and never cached — keeps PII/auth off disk.
 *
 * Bump CACHE_VERSION on any change here to roll caches over for every client.
 */
const CACHE_VERSION = "v1";
const STATIC_CACHE = `leavicy-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `leavicy-runtime-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";

// Minimal app-shell precache: the offline fallback page + brand icons.
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      // addAll is atomic; ignore individual 404s so install never blocks.
      .then((cache) =>
        Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url))),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.flatMap((key) =>
            [STATIC_CACHE, RUNTIME_CACHE].includes(key)
              ? []
              : [caches.delete(key)],
          ),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Allow the page to trigger an immediate activation after an update.
self.addEventListener("message", (event) => {
  // Defense-in-depth: only act on messages from a same-origin sender. A SW only
  // receives messages from in-scope (same-origin) clients, but verify anyway.
  if (event.origin && event.origin !== self.location.origin) return;
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

const isHttp = (url) => url.protocol === "http:" || url.protocol === "https:";
const cacheable = (res) => res && res.status === 200 && res.type === "basic";

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (cacheable(res)) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, res.clone());
  }
  return res;
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const res = await fetch(request);
    if (cacheable(res)) cache.put(request, res.clone());
    return res;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") {
      const offline = await caches.match(OFFLINE_URL);
      if (offline) return offline;
    }
    throw err;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request).then((res) => {
    if (cacheable(res)) cache.put(request, res.clone());
    return res;
  });
  if (cached) {
    // Refresh in the background; ignore failures (we already have a copy).
    network.catch(() => undefined);
    return cached;
  }
  // No cache: let the network result (or its rejection) flow to the browser.
  return network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET over http(s); everything else passes through.
  if (request.method !== "GET" || url.origin !== self.location.origin || !isHttp(url)) {
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Page navigations and client-side RSC fetches → fresh-first with fallback.
  if (request.mode === "navigate" || request.headers.has("RSC")) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});
