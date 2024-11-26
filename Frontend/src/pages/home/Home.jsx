import React, { useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import MessageContainer from "../../components/Messages/MessageContainer";
import { useSubscribe } from "../../context/hooks/useSubscribe.js";
import useConversations from "../../store/useConversation.js";
import QrCodeScanner from "../../components/Messages/QrCodeScanner.jsx";

const Home = () => {
  const { subscribeToPushNotifications } = useSubscribe();
  const { qrCode, qrCodeName } = useConversations();

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      subscribeToPushNotifications();
    }
  }, []);
  return (
    <>
      <div className="flex homeWrapper p-4 rounded-lg overflow-hidden bg-gray-400 bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-0">
        <Sidebar />
        {qrCode ? <QrCodeScanner /> : null}
        {qrCodeName ? <QrCodeScanner /> : null}
        <MessageContainer />
      </div>
    </>
  );
};

export default Home;
