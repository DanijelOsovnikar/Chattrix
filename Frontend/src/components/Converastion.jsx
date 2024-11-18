import React from "react";
import useConversations from "../store/useConversation";
import { useAuthContext } from "../context/AuthContext";

const Converastion = ({ conversation }) => {
  const { selectedConversation, setSelectedConversation } = useConversations();
  const isSelected = selectedConversation?._id === conversation._id;

  const { authUser } = useAuthContext();

  return (
    <>
      <div
        className={`flex gap-2 items-center hover:bg-slate-800 rounded p-2 cursor-pointer ${
          isSelected ? "bg-sky-800" : ""
        }`}
        onClick={() => setSelectedConversation(conversation)}
      >
        <div className="avatar">
          <div className="w-12 rounded-full">
            <img
              src={
                authUser.fullName !== "Magacin"
                  ? "public/vite.svg"
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
