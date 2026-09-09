// GlowNest service worker.
// Booking data must always be fresh, so pages and API calls go to the network first and only
// fall back to a cached shell when the phone is offline. Static assets are cached on first use.
const CACHE = "glownest-v1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll([OFFLINE_URL, "/images/icon-192.png"])),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  // Navigations: network first, offline page as the fallback.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Images, fonts, scripts and styles: serve from cache, refresh in the background.
  if (["image", "font", "style", "script"].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});

// New-booking alerts for the owner, delivered even when the app is closed.
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "GlowNest", body: event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || "GlowNest", {
      body: payload.body || "",
      icon: "/images/icon-192.png",
      badge: "/images/icon-192.png",
      data: { url: payload.url || "/admin" },
      tag: "glownest-booking",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/admin";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const open = clients.find((client) => client.url.includes(target));
      if (open) return open.focus();
      return self.clients.openWindow(target);
    }),
  );
});
