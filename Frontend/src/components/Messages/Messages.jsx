import { useEffect, useRef } from "react";
import Message from "./Message";
import useGetMessages from "../../context/hooks/useGetMessages";
import useConversations from "../../store/useConversation";
import TrackingView from "./TrackingView";

const Messages = () => {
  useGetMessages(); // Still needed to fetch initial messages when conversation changes
  const { messages, selectedConversation } = useConversations(); // Get messages directly from Zustand store
  const lastMessageRef = useRef();

  useEffect(() => {
    setTimeout(() => {
      lastMessageRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  }, [messages]);

  // Check if this is the tracking view
  if (selectedConversation?._id === "tracking_outgoing_requests") {
    return <TrackingView messages={messages} />;
  }

  return (
    <div className="px-4 flex-1 overflow-auto">
      {Array.isArray(messages) && messages.length > 0 ? (
        messages.map((message, index) => (
          <div
            key={message._id}
            ref={index === messages.length - 1 ? lastMessageRef : null}
          >
            <Message message={message} />
          </div>
        ))
      ) : (
        <div className="text-center text-gray-500 mt-4">No messages yet</div>
      )}
    </div>
  );
};

export default Messages;
