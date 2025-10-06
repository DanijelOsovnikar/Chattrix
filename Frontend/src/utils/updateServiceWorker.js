// Force service worker update
export const forceServiceWorkerUpdate = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        // console.log("🔄 Forcing service worker update...");
        await registration.update();

        // Wait for the new service worker to be ready
        if (registration.waiting) {
          // console.log("🔄 New service worker is waiting, skipping waiting...");
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        // console.log("🔄 Service worker update completed");
        return true;
      }
    } catch (error) {
      console.error("🔄 Failed to update service worker:", error);
      return false;
    }
  }
  return false;
};

// Add skip waiting handler to service worker
if (typeof self !== "undefined" && "addEventListener" in self) {
  self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
      self.skipWaiting();
    }
  });
}
