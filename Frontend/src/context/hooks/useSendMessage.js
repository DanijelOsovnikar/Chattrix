import { useState } from "react";
import toast from "react-hot-toast";
import useConversations from "../../store/useConversation";

const useSendMessage = () => {
  const [loading, setLoading] = useState(false);
  const { messages, setMessages, selectedConversation } = useConversations();

  const sendMessage = async (message) => {
    setLoading(true);

    try {
      const res = await fetch(
        `/api/messages/send/${selectedConversation._id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(message),
          credentials: "include",
        }
      );

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // For external requests, the backend returns a different structure
      // Don't add anything to messages - the real message will come via socket
      if (selectedConversation._id.startsWith("external_")) {
        toast.success(data.message || "External request sent successfully");
        // Let the socket listener handle adding the real message
        return;
      }

      // For regular internal messages, add the returned message
      if (data.message && typeof data.message === "object") {
        setMessages([...messages, data.message]);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return { sendMessage, loading };
};

export default useSendMessage;
