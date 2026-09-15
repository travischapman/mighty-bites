// Mighty Bites — service worker (cache-first app shell for offline + install).
const CACHE = "mighty-bites-v3";

const CORE = [
  "./",
  "index.html",
  "styles.css",
  "manifest.webmanifest",
  "foods.jsx",
  "treasures.jsx",
  "tweaks-panel.jsx",
  "mascot.jsx",
  "tournament.jsx",
  "app.jsx",
  "vendor/react.production.min.js",
  "vendor/react-dom.production.min.js",
  "vendor/babel.min.js",
  "vendor/fonts.css",
  "vendor/fonts/fredoka_v17_X7n64b87HvSqjb_WIi2yDCRwoQ_k7367_DWg89XyHw.woff2",
  "vendor/fonts/fredoka_v17_X7n64b87HvSqjb_WIi2yDCRwoQ_k7367_DWs89XyHw.woff2",
  "vendor/fonts/fredoka_v17_X7n64b87HvSqjb_WIi2yDCRwoQ_k7367_DWu89U.woff2",
  "vendor/fonts/nunito_v32_XRXV3I6Li01BKofIMeaBXso.woff2",
  "vendor/fonts/nunito_v32_XRXV3I6Li01BKofINeaB.woff2",
  "vendor/fonts/nunito_v32_XRXV3I6Li01BKofIO-aBXso.woff2",
  "vendor/fonts/nunito_v32_XRXV3I6Li01BKofIOOaBXso.woff2",
  "vendor/fonts/nunito_v32_XRXV3I6Li01BKofIOuaBXso.woff2",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-512-maskable.png",
  "icons/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      // Cache individually so one missing file can't fail the whole install.
      .then((c) => Promise.all(CORE.map((u) => c.add(u).catch((err) => console.warn("skip cache", u, err)))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  // App-shell fallback for navigations.
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).catch(() => caches.match("index.html").then((r) => r || caches.match("./")))
    );
    return;
  }

  // Cache-first for everything else; populate cache on first network hit.
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => cached))
  );
});
