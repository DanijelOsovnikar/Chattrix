import React from "react";
import useConversations from "../store/useConversation";
import { useAuthContext } from "../context/AuthContext";
import { useSocketContext } from "../context/SocketContext";

const Converastion = ({ conversation }) => {
  const { selectedConversation, setSelectedConversation } = useConversations();
  const isSelected = selectedConversation?._id === conversation._id;

  const { authUser } = useAuthContext();
  const { onlineUsers } = useSocketContext();

  const isOnline = onlineUsers.includes(conversation._id);

  return (
    <>
      <div
        className={`flex gap-2 items-center hover:bg-slate-800 rounded p-2 cursor-pointer ${
          isSelected ? "bg-sky-800" : ""
        }`}
        onClick={() => setSelectedConversation(conversation)}
      >
        <div className={`avatar ${isOnline ? "online" : ""}`}>
          <div className="w-12 rounded-full">
            <img
              src={
                authUser.fullName !== "Magacin"
                  ? "/vite.svg"
                  : "src/assets/react.svg"
              }
              alt="profile icon"
            />
          </div>
        </div>
        <div className="flex flex-col flex-1 justify-between">
          <p className="font-bold text-gray-200 text-end">
            {conversation.fullName}
          </p>
        </div>
      </div>
    </>
  );
};

export default Converastion;
