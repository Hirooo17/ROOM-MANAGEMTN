// Enhanced Service Worker with debugging

console.log("🔧 Service Worker: Loading...");

// Install event
self.addEventListener("install", () => {
  console.log("🔧 Service Worker: Installing...");
  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", (event) => {
  console.log("🔧 Service Worker: Activating...");
  event.waitUntil(self.clients.claim());
});

// Push event with enhanced debugging
self.addEventListener("push", (event) => {
  console.log("📱 Push event received:", event);
  
  let data = {};
  
  if (event.data) {
    try {
      data = event.data.json();
      console.log("✅ Push data parsed:", data);
    } catch (err) {
      console.error("❌ Push event JSON parse error:", err);
      console.log("Raw push data:", event.data.text());
    }
  } else {
    console.log("⚠️ Push event has no data");
  }

  const title = data.title || "Room Management";
  const body = data.body || "You have a new notification";
  const icon = data.icon || "/icon.png"; // Make sure this path is correct
  const badge = "/icon.png"; // Badge for Android
  const url = data.url || "/";
  const tag = data.tag || "room-notification";

  const options = {
    body,
    icon,
    badge,
    data: { url },
    tag,
    requireInteraction: true, // Keep notification visible until user interacts
    actions: [
      {
        action: "open",
        title: "Open App"
      }
    ]
  };

  console.log("🔔 Showing notification:", title, options);

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => {
        console.log("✅ Notification shown successfully");
      })
      .catch((error) => {
        console.error("❌ Error showing notification:", error);
      })
  );
});

// Notification click event with enhanced debugging
self.addEventListener("notificationclick", (event) => {
  console.log("🖱️ Notification clicked:", event);
  
  event.notification.close();
  
  const url = event.notification.data?.url || "/";
  console.log("🌐 Opening URL:", url);

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        console.log("👥 Found clients:", clientList.length);
        
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            console.log("🎯 Focusing existing window");
            return client.focus();
          }
        }
        
        // Open new window if none exists
        if (self.clients.openWindow) {
          console.log("🆕 Opening new window");
          return self.clients.openWindow(url);
        }
      })
      .catch((error) => {
        console.error("❌ Error handling notification click:", error);
      })
  );
});

// Push subscription change event
self.addEventListener("pushsubscriptionchange", (event) => {
  console.log("🔄 Push subscription changed:", event);
  
  event.waitUntil(
    // Resubscribe with new subscription
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: event.oldSubscription.options.applicationServerKey
    })
    .then((subscription) => {
      console.log("✅ Resubscribed:", subscription);
      // You might want to send this new subscription to your backend
    })
    .catch((error) => {
      console.error("❌ Resubscription failed:", error);
    })
  );
});

// Error event
self.addEventListener("error", (event) => {
  console.error("❌ Service Worker error:", event);
});

// Unhandled rejection
self.addEventListener("unhandledrejection", (event) => {
  console.error("❌ Service Worker unhandled rejection:", event);
});

console.log("✅ Service Worker: Loaded successfully");