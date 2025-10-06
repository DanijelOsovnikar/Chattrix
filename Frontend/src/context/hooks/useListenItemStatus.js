import { useEffect } from "react";
import { useSocketContext } from "../SocketContext";
import { useAuthContext } from "../AuthContext";
import toast from "react-hot-toast";

const useListenItemStatus = () => {
  const { socket } = useSocketContext();
  const { authUser } = useAuthContext();

  useEffect(() => {
    // Listen for item ready notifications
    socket?.on("itemReady", (notification) => {
      // Check user preferences (this will be controlled by backend, but we can add frontend checks too)
      const preferences = authUser?.notificationPreferences;

      // Show toast notification (controlled by backend, but respect frontend preferences too)
      if (preferences?.toastNotifications !== false) {
        toast.success(
          "📦 Your item(s) are ready and will be delivered to the cashier!",
          {
            duration: 6000,
            position: "top-center",
          }
        );
      }

      // Show browser notification if permission is granted and user wants them
      if (preferences?.browserNotifications !== false) {
        try {
          if (Notification.permission === "granted") {
            new Notification("Items Ready for Pickup", {
              body: notification.message,
              icon: "/react.svg",
              badge: "/react.svg",
              requireInteraction: true, // Keep notification visible until user interacts
            });
          } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then((permission) => {
              if (permission === "granted") {
                new Notification("Items Ready for Pickup", {
                  body: notification.message,
                  icon: "/react.svg",
                  badge: "/react.svg",
                  requireInteraction: true,
                });
              }
            });
          }
        } catch (err) {
          console.error("Error with browser notification:", err);
        }
      }
    });

    // Listen for item not ready notifications
    socket?.on("itemNotReady", (notification) => {
      // Check user preferences
      const preferences = authUser?.notificationPreferences;

      // Show toast notification (controlled by backend, but respect frontend preferences too)
      if (preferences?.toastNotifications !== false) {
        toast("⏳ Your item(s) status has been updated to not ready", {
          duration: 4000,
          position: "top-center",
          icon: "⚠️",
        });
      }

      // Show browser notification if permission is granted and user wants them
      if (preferences?.browserNotifications !== false) {
        try {
          if (Notification.permission === "granted") {
            new Notification("Item Status Updated", {
              body: notification.message,
              icon: "/react.svg",
              badge: "/react.svg",
            });
          }
        } catch (err) {
          console.error("Error with browser notification:", err);
        }
      }
    });

    // Cleanup listeners on unmount
    return () => {
      socket?.off("itemReady");
      socket?.off("itemNotReady");
    };
  }, [socket, authUser?.notificationPreferences]);
};

export default useListenItemStatus;
