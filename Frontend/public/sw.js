self.addEventListener("push", (e) => {
  let data = {};
  if (e.data) {
    data = e.data.json();
  }

  console.log("Push Received with Data:", data);

  try {
    e.waitUntil(
      self.registration.showNotification(data.title || "Default Title", {
        body: data.body + " EAN: " + data.ean || "Default Body",
        icon: data.icon || "/default-icon.png",
        badge: data.badge || "/default-badge.png",
      })
    );
    console.log("Notification shown successfully!");
  } catch (err) {
    console.error("Failed to show notification:", err);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close(); // Close the notification

  const urlToOpen = event.notification.data;

  if (urlToOpen) {
    event.waitUntil(
      clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clientList) => {
          for (let client of clientList) {
            if (client.url === urlToOpen && "focus" in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});
