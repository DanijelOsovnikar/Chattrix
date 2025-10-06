import { useAuthContext } from "../AuthContext";

// export const useSubscribe = () => {
//   const { authUser } = useAuthContext();
//   const publicVapidKey =
//     "BEvmu6KRMuMBPD7xWEYeTQvOfw-TNTns8R0xifdmq1Y89gJql2-W_17TvHGU6HnusR4SlQqvMgbY8d--FUHvc4w";

//   // Check for service worker
//   if ("serviceWorker" in navigator) {
//     send().catch((err) => console.error(err));
//   }

//   // Register SW, Register Push, Send Push
//   async function send() {
//     const token = localStorage.getItem("user");
//     // Register Service Worker
//     console.log("Registering service worker...");
//     const register = await navigator.serviceWorker.register("./sw.js", {
//       scope: "/",
//     });
//     console.log("Service Worker Registered...");

//     // Register Push
//     console.log("Registering Push...");
//     const subscription = await register.pushManager.subscribe({
//       userVisibleOnly: true,
//       applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
//     });
//     console.log("Push Registered...");

//     // Send Push Notification
//     console.log("Sending Push...");
//     await fetch(`http://localhost:3000/api/subscribe/${authUser._id}`, {
//       method: "POST",
//       body: JSON.stringify(subscription),
//       headers: {
//         "Content-type": "application/json",
//         Authorization: `Bearer ${token}`,
//       },
//     });
//     console.log("Push Sent...");
//   }

//   function urlBase64ToUint8Array(base64String) {
//     const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
//     const base64 = (base64String + padding)
//       .replace(/\-/g, "+")
//       .replace(/_/g, "/");

//     const rawData = window.atob(base64);
//     const outputArray = new Uint8Array(rawData.length);

//     for (let i = 0; i < rawData.length; ++i) {
//       outputArray[i] = rawData.charCodeAt(i);
//     }
//     return outputArray;
//   }
// };

export const useSubscribe = () => {
  const { authUser } = useAuthContext();
  const publicVapidKey =
    "BGLsTqrNBjcqlsu4VjD5bWlJ7C5O-xGlR-fTOl9Ur3MWCMHjDU-MEEWQA-Q3Q-QPLCVd0-fBSmLVSTNezas7Ibs";

  const subscribeToPushNotifications = () => {
    if ("serviceWorker" in navigator) {
      send().catch((err) => console.error("Push subscription error:", err));
    }
  };

  // Register SW, Register Push, Send Push
  const send = async () => {
    try {
      const token = localStorage.getItem("user");

      // Register Service Worker
      // console.log("Registering service worker...");
      const register = await navigator.serviceWorker.register("./sw.js", {
        scope: "/",
      });
      // console.log("Service Worker Registered...");

      // Wait for the service worker to activate
      if (!navigator.serviceWorker.controller) {
        // console.log("Waiting for Service Worker to activate...");
        await new Promise((resolve) => {
          navigator.serviceWorker.addEventListener("controllerchange", resolve);
        });
      }

      // console.log("Service Worker is now active.");

      // Check if push manager is available
      if (!register.pushManager) {
        throw new Error("Push messaging is not supported");
      }

      // Check for existing subscription and unsubscribe to force fresh subscription
      const existingSubscription = await register.pushManager.getSubscription();
      if (existingSubscription) {
        // console.log(
        //   "Found existing subscription, unsubscribing to refresh with current VAPID keys..."
        // );
        await existingSubscription.unsubscribe();
        // console.log("Existing subscription removed");
      }

      // Register Push with current VAPID keys
      // console.log("Registering Push with current VAPID keys...");
      const subscription = await register.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      });
      // console.log("Push Registered successfully with current VAPID keys");

      // Send Push Notification subscription to server
      // console.log("Sending subscription to server...");
      await fetch(`/api/subscribe/${authUser._id}`, {
        method: "POST",
        body: JSON.stringify(subscription),
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      // console.log("Subscription sent to server successfully");
    } catch (error) {
      console.error("Error in push subscription process:", error);
      // Don't rethrow the error to prevent it from breaking the app
    }
  };

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  return { subscribeToPushNotifications };
};
