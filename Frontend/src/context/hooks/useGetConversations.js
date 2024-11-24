import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import useConversations from "../../store/useConversation";
import { useConversationContext } from "../ConversationContext";

const useGetConversations = () => {
  const [loading, setLoading] = useState(false);
  const { setConversationss } = useConversations();
  const { conversations, setConversations } = useConversationContext();

  useEffect(() => {
    const getConversations = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/users", {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();

        if (data.error) {
          throw new Error(data.error);
        }

        setConversations(data);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    getConversations();
  }, []);

  return { loading, conversations };
};

export default useGetConversations;
