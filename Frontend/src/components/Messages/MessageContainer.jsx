import React from "react";
import Messages from "./Messages";
import MessageInput from "./MessageInput";

const MessageContainer = () => {
  return (
    <div className="md:min-w-[650px] flex flex-col">
      <>
        {/* <Header/> */}
        <div className=" bg-slate-800 px-4 py-2 mb-2">
          <span className=" label-text">To: </span>
          <span className=" text-white font-bold">John doe</span>
        </div>
        <Messages />
        <MessageInput />
      </>
    </div>
  );
};

export default MessageContainer;

const Nochatselected = () => {
  return;
  <div className="flex items-center justify-center w-full h-full">
    <div className="px-4 text-center sm: text-1g md:text-xl text-gray-200 font-semibold flex flex-col items-center gap-2">
      <p>Welcome John Doe</p>
      <p>Select a chat to start messaging</p>
    </div>
  </div>;
};
