import React, { useState } from "react";
import Converastion from "./Converastion";
import useGetConversations from "../context/hooks/useGetConversations";
import useListenMessages from "../context/hooks/useListenMessages";
import useConversations from "../store/useConversation";

const Conversations = () => {
  const { loading, conversations } = useGetConversations();
  const { conversationss } = useConversations();

  useListenMessages();

  return (
    <div className="py-2 flex flex-col overflow-auto convCLass">
      {conversationss.map((e) => (
        <Converastion key={e._id} conversation={e} />
      ))}
      {loading ? (
        <span className="loading loading-spinner mx-auto"></span>
      ) : null}
    </div>
  );
};

export default Conversations;
