import { useEffect, useState, useCallback } from "react";
import useConversations from "../../store/useConversation";
import toast from "react-hot-toast";

const useGetMessages = () => {
  const [loading, setLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [lastFetchedConversationId, setLastFetchedConversationId] =
    useState(null);
  const { messages, selectedConversation, setMessages } = useConversations();

  const getMessages = useCallback(async () => {
    if (!selectedConversation?._id) return;

    setLoading(true);
    try {
      const { messages: currentMessages } = useConversations.getState();

      const res = await fetch(`/api/messages/${selectedConversation._id}`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const serverMessageIds = new Set(data?.map((msg) => msg._id) || []);
      const realtimeMessages =
        currentMessages?.filter((msg) => !serverMessageIds.has(msg._id)) || [];

      if (realtimeMessages.length > 0) {
        setMessages([...data, ...realtimeMessages]);
      } else {
        setMessages(data);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [selectedConversation, setMessages]);

  useEffect(() => {
    if (selectedConversation?._id) {
      const isNewConversation =
        lastFetchedConversationId !== selectedConversation._id;

      if (isNewConversation) {
        // Clear messages immediately when switching to a new conversation
        setMessages([]);
        getMessages();
        setLastFetchedConversationId(selectedConversation._id);
      } else if (refreshTrigger > 0) {
        // Only refresh if explicitly requested
        getMessages();
      }
    } else {
      setMessages([]);
      setLastFetchedConversationId(null);
    }
  }, [
    selectedConversation?._id,
    refreshTrigger,
    getMessages,
    lastFetchedConversationId,
    setMessages,
  ]);

  // Listen for push notification message refresh events
  useEffect(() => {
    const handleRefreshMessages = (event) => {
      if (event.detail.conversationId === selectedConversation?._id) {
        setRefreshTrigger((prev) => prev + 1);
      }
    };

    window.addEventListener("refreshMessages", handleRefreshMessages);

    return () => {
      window.removeEventListener("refreshMessages", handleRefreshMessages);
    };
  }, [selectedConversation?._id]);

  return { messages, loading };
};

export default useGetMessages;
