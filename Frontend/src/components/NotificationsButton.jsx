import React from "react";
import { useAuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";

const NotificationsButton = () => {
  const { authUser } = useAuthContext();

  const offHandler = async () => {
    try {
      const res = await fetch(`/api/deleteSubsription/${authUser._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      toast(data.message);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="notifGroup">
      <button
        className="hover:bg-amber-400 hover:text-black"
        onClick={offHandler}
      >
        Notification Off
      </button>
    </div>
  );
};

export default NotificationsButton;
