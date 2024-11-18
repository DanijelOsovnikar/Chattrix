import React, { useEffect } from "react";
import Messages from "./Messages";
import MessageInput from "./MessageInput";
import useConversations from "../../store/useConversation";
import { useAuthContext } from "../../context/AuthContext";

const MessageContainer = () => {
  const { selectedConversation, setSelectedConversation } = useConversations();

  useEffect(() => {
    return () => {
      setSelectedConversation(null);
    };
  }, [setSelectedConversation]);

  return (
    <div className="messContainer flex flex-col">
      {!selectedConversation ? (
        <Nochatselected />
      ) : (
        <>
          <div className=" bg-slate-800 px-4 py-2 mb-2">
            <span className=" label-text">To: </span>
            <span className=" text-white font-bold">
              {selectedConversation.fullName}
            </span>
          </div>
          <Messages />
          <MessageInput />
        </>
      )}
    </div>
  );
};

export default MessageContainer;

const Nochatselected = () => {
  const { authUser } = useAuthContext();
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="px-4 text-center sm: text-1g md:text-xl text-gray-200 font-semibold flex flex-col items-center gap-2">
        <p>
          {authUser?.fullName !== "Magacin" ? "Dobro došao!" : "Dobro došli!"}
        </p>
        <p>
          {authUser?.fullName !== "Magacin"
            ? "Posalji zahtev magacinu"
            : "Magacioneri"}
        </p>
      </div>
    </div>
  );
};
