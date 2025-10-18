import { useEffect } from "react";
import Messages from "./Messages";
import MessageInput from "./MessageInput";
import useConversations from "../../store/useConversation";
import { useAuthContext } from "../../context/AuthContext";
import useListenMessageStatusSync from "../../context/hooks/useListenMessageStatusSync";

const MessageContainer = () => {
  const { selectedConversation, setSelectedConversation } = useConversations();

  // Enable real-time checkbox synchronization for warehousemen
  useListenMessageStatusSync();

  useEffect(() => {
    return () => {
      setSelectedConversation(null);
    };
  }, [setSelectedConversation]);

  return (
    <div className="messContainer max-h-[calc(100vh-155px)] flex flex-col max-[700px]:max-h-[calc(100vh-260px)] min-[700px]:ml-4 min-[1024px]:ml-8">
      {!selectedConversation ? (
        <Nochatselected />
      ) : (
        <>
          <div className=" bg-neutral rounded px-4 py-2 mb-2">
            <span className=" label-text">To: </span>
            <span className=" text-white font-bold">
              {selectedConversation.fullName}
            </span>
          </div>
          <Messages />
          {selectedConversation.fullName === "Admin" ? null : <MessageInput />}
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
      <div className="px-4 text-center sm: text-1g md:text-xl text-base-content font-semibold flex flex-col items-center gap-2">
        <p>Welcome</p>
        <p>
          {authUser?.fullName !== "Magacin"
            ? "Send a request to the warehouse"
            : "You can manage product requests here"}
        </p>
      </div>
    </div>
  );
};
