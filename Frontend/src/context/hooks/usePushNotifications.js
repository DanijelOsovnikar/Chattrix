import { useEffect } from "react";
import { useConversationContext } from "../ConversationContext";
import useConversations from "../../store/useConversation";
import toast from "react-hot-toast";

const usePushNotifications = () => {
  const { conversations, setConversations } = useConversationContext();
  const { selectedConversation } = useConversations();

  useEffect(() => {
    // console.log(
    //   "📱 React App: usePushNotifications - Setting up push notification listener"
    // );

    // Listen for messages from the service worker
    const handleServiceWorkerMessage = (event) => {
      // console.log("📱 React App: Service worker message received:", event);
      // console.log("📱 React App: Event origin:", event.origin);
      // console.log("📱 React App: Event data:", event.data);

      if (event.data && event.data.type === "PUSH_NOTIFICATION") {
        const notificationData = event.data.data;
        // console.log(
        //   "📱 React App: Processing push notification:",
        //   notificationData
        // );

        // Always show toast and trigger visual updates, regardless of EAN
        toast(
          `📩 Push notification: ${
            notificationData.body || notificationData.title
          }`,
          {
            icon: "💬",
            duration: 4000,
          }
        );

        // console.log("📱 React App: Dispatching pushNotificationReceived event");

        // Dispatch a custom event that other hooks can listen to
        const customEvent = new CustomEvent("pushNotificationReceived", {
          detail: {
            notificationData,
            timestamp: Date.now(),
          },
        });

        window.dispatchEvent(customEvent);
        // console.log("📱 React App: Custom event dispatched:", customEvent);

        // If the push notification is for the currently selected conversation,
        // trigger a message refresh
        if (
          selectedConversation &&
          notificationData.senderId === selectedConversation._id
        ) {
          // console.log(
          //   "📱 React App: Push notification is for selected conversation, triggering message refresh"
          // );
          // Dispatch a special event for message refresh
          window.dispatchEvent(
            new CustomEvent("refreshMessages", {
              detail: { conversationId: selectedConversation._id },
            })
          );
        }

        // Force a conversations update to trigger re-renders
        if (conversations && conversations.length > 0) {
          // console.log("📱 React App: Forcing conversation list update");
          setConversations([...conversations]);
        }
      } else {
        // console.log(
        //   "📱 React App: Message from service worker but not a push notification:",
        //   event.data
        // );
      }
    };

    // Check if service worker is available
    if ("serviceWorker" in navigator) {
      // console.log("📱 React App: Service worker API is available");

      if (navigator.serviceWorker.controller) {
        // console.log("📱 React App: Service worker is controlling this page");
      } else {
        // console.log(
        //   "📱 React App: Service worker is not controlling this page"
        // );
      }

      // Register the event listener
      navigator.serviceWorker.addEventListener(
        "message",
        handleServiceWorkerMessage
      );
      // console.log("📱 React App: Message event listener registered");
    } else {
      // console.log("📱 React App: Service worker API not available");
    }

    return () => {
      // Clean up the event listener
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener(
          "message",
          handleServiceWorkerMessage
        );
        // console.log("📱 React App: Message event listener removed");
      }
    };
  }, [conversations, setConversations, selectedConversation]);
};

export default usePushNotifications;
