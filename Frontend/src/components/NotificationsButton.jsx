import React from "react";

const NotificationsButton = () => {
  const offHandler = async () => {
    const request = await Notification.requestPermission();
    if (request === "denied") {
      console.log("notific disabled");
    }
  };

  const onHandler = async () => {
    const request = await Notification.requestPermission();
    if (request === "granted") {
      console.log("notific enabled");
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
