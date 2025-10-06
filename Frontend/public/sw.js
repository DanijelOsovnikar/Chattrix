// Add skip waiting handler for updates
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    // console.log("🔄 Service Worker: Received SKIP_WAITING message");
    self.skipWaiting();
  }
});

// Handle service worker installation
self.addEventListener("install", () => {
  // console.log("🔄 Service Worker: Installing...");
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener("activate", (event) => {
  // console.log("🔄 Service Worker: Activating...");
  // Take control of all clients immediately
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (e) => {
  // console.log("🔔 Service Worker: Push event received!");

  let data = {};
  if (e.data) {
    try {
      data = e.data.json();
      // console.log("🔔 Service Worker: Push data parsed:", data);
    } catch (error) {
      console.error("🔔 Service Worker: Failed to parse push data:", error);
    }
  } else {
    // console.log("🔔 Service Worker: No data in push event");
  }

  try {
    const notificationOptions = {
      body: data.body || "Default Body",
      icon: data.icon || "/vite.svg",
      badge: data.badge || "/react.svg",
      tag: "message-notification",
      requireInteraction: false,
      silent: false,
    };

    // console.log(
    //   "🔔 Service Worker: Attempting to show notification with options:",
    //   notificationOptions
    // );

    e.waitUntil(
      Promise.all([
        // Show the notification
        self.registration
          .showNotification(data.title || "New Message", notificationOptions)
          .then(() => {
            // console.log(
            //   "🔔 Service Worker: Notification displayed successfully!"
            // );
          })
          .catch((error) => {
            console.error(
              "🔔 Service Worker: Failed to display notification:",
              error
            );
          }),
        // Post message to all clients (React app)
        self.clients
          .matchAll({ includeUncontrolled: true })
          .then((clients) => {
            // console.log(
            //   "🔔 Service Worker: Found",
            //   clients.length,
            //   "clients to notify"
            // );

            if (clients.length === 0) {
              // console.warn(
              //   "🔔 Service Worker: No clients found - React app might not be active"
              // );
            }

            const messagePayload = {
              type: "PUSH_NOTIFICATION",
              data: data,
              timestamp: Date.now(),
            };

            clients.forEach((client, index) => {
              // console.log(
              //   `🔔 Service Worker: Posting message to client ${index + 1}:`,
              //   messagePayload
              // );
              try {
                client.postMessage(messagePayload);
                // console.log(
                //   `🔔 Service Worker: Message sent successfully to client ${
                //     index + 1
                //   }`
                // );
              } catch (error) {
                console.error(
                  `🔔 Service Worker: Failed to send message to client ${
                    index + 1
                  }:`,
                  error
                );
              }
            });
          })
          .catch((error) => {
            console.error("🔔 Service Worker: Failed to get clients:", error);
          }),
      ])
    );
    // console.log("🔔 Service Worker: Push event processed successfully!");
  } catch (err) {
    console.error("🔔 Service Worker: Failed to process push event:", err);
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close(); // Close the notification

  const urlToOpen = event.notification.data;

  if (urlToOpen) {
    event.waitUntil(
      self.clients
        .matchAll({ type: "window", includeUncontrolled: true })
        .then((clientList) => {
          for (let client of clientList) {
            if (client.url === urlToOpen && "focus" in client) {
              return client.focus();
            }
          }
          if (self.clients.openWindow) {
            return self.clients.openWindow(urlToOpen);
          }
        })
    );
  }
});
