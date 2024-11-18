import React, { useEffect, useRef } from "react";
import Message from "./Message";
import useGetMessages from "../../context/hooks/useGetMessages";

const Messages = () => {
  const { messages, loading } = useGetMessages();
  const lastMessageRef = useRef();

  useEffect(() => {
    setTimeout(() => {
      lastMessageRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  }, [messages]);

  return (
    <div className="px-4 flex-1 overflow-auto">
      {messages.map((message) => (
        <div key={message._id} ref={lastMessageRef}>
          <Message message={message} />
        </div>
      ))}
    </div>
  );
};

export default Messages;
