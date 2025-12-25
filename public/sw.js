// Service Worker for Push Notifications

self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");
  event.waitUntil(clients.claim());
});

// Handle push events
self.addEventListener("push", (event) => {
  console.log("[SW] Push received:", event);

  let data = {
    title: "New Message",
    body: "You have a new message from your project team.",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: {},
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch (e) {
      console.error("[SW] Failed to parse push data:", e);
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || "/favicon.ico",
    badge: data.badge || "/favicon.ico",
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: [
      { action: "open", title: "View" },
      { action: "dismiss", title: "Dismiss" },
    ],
    requireInteraction: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event);

  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  // Open or focus the portal page
  const projectToken = event.notification.data?.project_token;
  const targetUrl = projectToken ? `/p/${projectToken}` : "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Try to find an existing window with the portal
      for (const client of clientList) {
        if (client.url.includes("/p/") && "focus" in client) {
          return client.focus();
        }
      }
      // Open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle notification close
self.addEventListener("notificationclose", (event) => {
  console.log("[SW] Notification closed:", event);
});
