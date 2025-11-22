import { useCallback } from "react";
import { useAuthContext } from "../AuthContext";

// export const useSubscribe = () => {
//   const { authUser } = useAuthContext();
//   const publicVapidKey =
//     "BEvmu6KRMuMBPD7xWEYeTQvOfw-TNTns8R0xifdmq1Y89gJql2-W_17TvHGU6HnusR4SlQqvMgbY8d--FUHvc4w";

export const useSubscribe = () => {
  const { authUser } = useAuthContext();
  const publicVapidKey =
    "BGLsTqrNBjcqlsu4VjD5bWlJ7C5O-xGlR-fTOl9Ur3MWCMHjDU-MEEWQA-Q3Q-QPLCVd0-fBSmLVSTNezas7Ibs";

  const subscribeToPushNotifications = useCallback(async () => {
    if (!authUser?._id) {
      throw new Error("User is not authenticated");
    }

    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      !("serviceWorker" in navigator)
    ) {
      throw new Error("Push notifications are not supported on this device");
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("Notification permission was not granted");
    }

    // Play a silent sound to enable audio playback (bypasses autoplay restrictions)
    try {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const buffer = audioContext.createBuffer(1, 1, 22050);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start();
      await audioContext.resume();
    } catch (audioError) {
      console.log("Audio context initialization failed:", audioError);
    }

    const registration = await navigator.serviceWorker.ready;
    if (!registration.pushManager) {
      throw new Error("Push manager is unavailable");
    }

    const existingSubscription =
      await registration.pushManager.getSubscription();
    if (existingSubscription) {
      await existingSubscription.unsubscribe();
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
    });

    const token = localStorage.getItem("user");
    const headers = {
      "Content-type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`/api/subscribe/${authUser._id}`, {
      method: "POST",
      body: JSON.stringify(subscription),
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to persist push subscription on the server");
    }

    return subscription;
  }, [authUser]);

  const unsubscribeFromPushNotifications = useCallback(async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }

    return false;
  }, []);

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

  return { subscribeToPushNotifications, unsubscribeFromPushNotifications };
};
