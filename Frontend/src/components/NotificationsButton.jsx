import React from "react";

const NotificationsButton = () => {
  const offHandler = () => {
    if (Notification.permission === "granted") {
      Notification.requestPermission();
    }
  };

  const onHandler = () => {
    if (Notification.permission === "denied") {
      Notification.requestPermission();
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
      <button
        className="hover:bg-amber-400 hover:text-black"
        onClick={onHandler}
      >
        Notification On
      </button>
    </div>
  );
};

export default NotificationsButton;
