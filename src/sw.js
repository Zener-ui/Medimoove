import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

// Standard Workbox precaching — vite-plugin-pwa injects the asset
// manifest here at build time in injectManifest mode.
precacheAndRoute(self.__WB_MANIFEST);

// Carried over from the previous generateSW config's runtimeCaching —
// injectManifest mode doesn't read that config key, so it has to be
// registered by hand here to keep the same behavior.
registerRoute(
  ({ url }) => url.origin === "https://api.mapbox.com",
  new CacheFirst({
    cacheName: "mapbox-cache",
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 })],
  })
);

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// Receives the actual push message sent from the backend (see
// backend/controllers/pushController.js dispatchInternal) and shows it
// as a system notification — this is the part that makes it appear in
// the phone's notification shade like any other app.
self.addEventListener("push", (event) => {
  let data = { title: "Medimoove", body: "You have a new notification." };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // Payload wasn't JSON — fall back to the default text above rather
    // than showing a broken/blank notification.
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      data: { url: data.url || "/" },
    })
  );
});

// Tapping the notification focuses an already-open Medimoove tab if one
// exists, instead of always opening a new one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
