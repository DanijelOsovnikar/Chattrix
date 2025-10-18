import { useEffect } from "react";
import { useAuthContext } from "../AuthContext";
import { useSocketContext } from "../SocketContext";
import useConversation from "../../store/useConversation";
import toast from "react-hot-toast";

const useListenMessageStatusSync = () => {
  const { authUser } = useAuthContext();
  const { socket } = useSocketContext();
  const { setMessages } = useConversation();

  useEffect(() => {
    // Only warehousemen should listen for message status sync
    if (authUser?.role !== "warehouseman" || !socket) {
      return;
    }

    const handleMessageStatusSync = (syncData) => {
      const { messageId, opened, updatedBy } = syncData;

      // console.log(`📋 Message status sync received:`, {
      //   messageId,
      //   opened,
      //   updatedBy,
      //   timestamp: new Date()
      // });

      // Update the message state in real-time
      setMessages((prevMessages) =>
        prevMessages.map((message) =>
          message._id === messageId ? { ...message, opened: opened } : message
        )
      );

      // Show a toast notification to indicate the change
      const action = opened ? "checked" : "unchecked";
      toast(`📋 Message ${action} by ${updatedBy}`, {
        icon: opened ? "✅" : "❌",
        duration: 3000,
        position: "top-right",
      });
    };

    // Listen for message status synchronization from other warehousemen
    socket.on("messageStatusSync", handleMessageStatusSync);

    // Cleanup
    return () => {
      socket.off("messageStatusSync", handleMessageStatusSync);
    };
  }, [authUser?.role, socket, setMessages]);
};

export default useListenMessageStatusSync;
