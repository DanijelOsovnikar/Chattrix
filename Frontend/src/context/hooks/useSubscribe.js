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
    "BEvmu6KRMuMBPD7xWEYeTQvOfw-TNTns8R0xifdmq1Y89gJql2-W_17TvHGU6HnusR4SlQqvMgbY8d--FUHvc4w";

  Notification.requestPermission().then((permission) => {
    if (permission === "granted") {
      console.log("Notification permission granted.");
    } else {
      console.log("Notification permission denied.");
    }
  });

  const subscribeToPushNotifications = () => {
    if ("serviceWorker" in navigator) {
      send().catch((err) => console.error("Push subscription error:", err));
    }
  };

  // Register SW, Register Push, Send Push
  async function send() {
    const token = localStorage.getItem("user");

    // Check if a service worker is already registered
    const existingRegistration =
      await navigator.serviceWorker.getRegistration();
    if (existingRegistration) {
      console.log("Service worker already registered.");
      const existingSubscription =
        await existingRegistration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log("Push subscription already exists:", existingSubscription);
        return; // Avoid re-subscribing
      }
    }

    // Register Service Worker
    console.log("Registering service worker...");
    const register = await navigator.serviceWorker.register("./sw.js", {
      scope: "/",
    });
    console.log("Service Worker Registered...");

    // Register Push
    console.log("Registering Push...");
    const subscription = await register.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
    });
    console.log("Push Registered...");

    // Send Push Notification
    console.log("Sending Push...");
    await fetch(`/api/subscribe/${authUser._id}`, {
      method: "POST",
      body: JSON.stringify({ subscription, createdAt: new Date() }),
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("Push Sent...");
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
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
