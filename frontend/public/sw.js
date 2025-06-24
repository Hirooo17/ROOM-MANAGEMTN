self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data.json();
  } catch (err) {
    console.error("Push event JSON parse error:", err);
  }

  const title = data.title || "New Notification";
  const body = data.body || "You have a new message";
  const icon = data.icon || "/icon.png";
  const url = data.url || "/";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      data: { url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      ? self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
          for (const client of clientList) {
            if (client.url === url && "focus" in client) {
              return client.focus();
            }
          }
          if (self.clients.openWindow) {
            return self.clients.openWindow(url);
          }
        })
      : Promise.resolve()
  );
});
