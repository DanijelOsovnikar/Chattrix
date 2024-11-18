import React from "react";
import Converastion from "./Converastion";
import useGetConversations from "../context/hooks/useGetConversations";

const Conversations = () => {
  const { loading, conversations } = useGetConversations();

  return (
    <div className="py-2 flex flex-col overflow-auto">
      {conversations.map((e) => (
        <Converastion key={e._id} conversation={e} />
      ))}
      {loading ? (
        <span className="loading loading-spinner mx-auto"></span>
      ) : null}
    </div>
  );
};

export default Conversations;
