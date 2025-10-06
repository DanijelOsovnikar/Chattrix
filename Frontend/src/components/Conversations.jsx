import Converastion from "./Converastion";
import useGetConversations from "../context/hooks/useGetConversations";
import useListenMessages from "../context/hooks/useListenMessages";

const Conversations = () => {
  const { loading, conversations } = useGetConversations();

  useListenMessages();

  return (
    <div className="py-2 flex flex-col overflow-auto convCLass">
      {conversations.map((e) => (
        <Converastion key={e._id || e.fullName} conversation={e} />
      ))}
      {loading ? (
        <span className="loading loading-spinner mx-auto"></span>
      ) : null}
    </div>
  );
};

export default Conversations;
