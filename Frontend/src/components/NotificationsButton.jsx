import { useState } from "react";
import { useAuthContext } from "../context/AuthContext";
import { useSubscribe } from "../context/hooks/useSubscribe";
import toast from "react-hot-toast";

const NotificationsButton = () => {
  const { authUser } = useAuthContext();
  const { subscribeToPushNotifications, unsubscribeFromPushNotifications } =
    useSubscribe();
  const [enableLoading, setEnableLoading] = useState(false);
  const [disableLoading, setDisableLoading] = useState(false);

  const onEnable = async () => {
    if (!authUser?._id) {
      toast.error("Please sign in before enabling notifications");
      return;
    }

    setEnableLoading(true);
    try {
      await subscribeToPushNotifications();
      toast.success("Push notifications enabled");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Enable failed";
      toast.error(message);
    } finally {
      setEnableLoading(false);
    }
  };

  const offHandler = async () => {
    if (!authUser?._id) {
      toast.error("Please sign in before disabling notifications");
      return;
    }

    setDisableLoading(true);
    try {
      await unsubscribeFromPushNotifications();

      const token = localStorage.getItem("user");
      const headers = token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {};

      const res = await fetch(`/api/deleteSubscription/${authUser._id}`, {
        method: "DELETE",
        credentials: "include",
        headers,
      });
      const data = await res.json();
      toast.success(data.message ?? "Push notifications disabled");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Disable failed";
      toast.error(message);
    } finally {
      setDisableLoading(false);
    }
  };

  return (
    <>
      <p className="text-sm mb-2">Settings:</p>
      <button
        className="btn btn-sm btn-block btn-ghost justify-start"
        onClick={onEnable}
        disabled={enableLoading}
      >
        {enableLoading ? "Enabling..." : "Enable Notifications"}
      </button>
      <button
        className="btn btn-sm btn-block btn-ghost justify-start"
        onClick={offHandler}
        disabled={disableLoading}
      >
        {disableLoading ? "Disabling..." : "Notification Off"}
      </button>
    </>
  );
};

export default NotificationsButton;
