import { useEffect } from "react";
import { useSocketContext } from "../SocketContext";
import useConversations from "../../store/useConversation";
import useGetConversations from "./useGetConversations";
import { useConversationContext } from "../ConversationContext";

import notificationSound from "../../assets/notification.mp3";

const useListenMessages = () => {
  const { socket } = useSocketContext();
  const { messages, setMessages, selectedConversation } = useConversations();
  const { setConversations } = useConversationContext();
  const { conversations } = useGetConversations();

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket?.on("newMessage", async (newMessage) => {
      window.dispatchEvent(
        new CustomEvent("conversationNewMessage", {
          detail: newMessage,
        })
      );

      try {
        const sound = new Audio(notificationSound);
        await sound.play();
      } catch {
        // Sound play failed, continue silently
      }

      const senderId =
        typeof newMessage.senderId === "object"
          ? newMessage.senderId._id
          : newMessage.senderId;

      const receiverId =
        typeof newMessage.receiverId === "object"
          ? newMessage.receiverId._id
          : newMessage.receiverId;

      const currConversation = conversations.find((i) => i._id === senderId);

      // Update conversations list if conversation exists
      if (currConversation) {
        const updatedConversations = [
          currConversation,
          ...conversations.filter((e) => e._id !== currConversation._id),
        ];
        setConversations(updatedConversations);
      }

      const isForCurrentConversation =
        selectedConversation &&
        (selectedConversation._id === senderId ||
          selectedConversation._id === receiverId);

      if (isForCurrentConversation) {
        const store = useConversations.getState();
        const currentMessages = store.messages;
        const setMessagesFunc = store.setMessages;

        if (!Array.isArray(currentMessages)) {
          setMessagesFunc([newMessage]);
        } else {
          const newMessagesArray = [...currentMessages, newMessage];
          setMessagesFunc(newMessagesArray);
        }
      }

      // Show notification with EAN and name
      try {
        const senderName =
          currConversation?.fullName ||
          newMessage.senderId?.fullName ||
          "Unknown User";

        const ean = newMessage.messages?.[0]?.ean || "No EAN";
        const naziv = newMessage.messages?.[0]?.naziv || "No Name";

        // Show browser notification only
        if (Notification.permission === "granted") {
          new Notification(`New message from ${senderName}`, {
            body: `EAN: ${ean} - ${naziv}`,
            icon: "/react.svg",
          });
        } else if (Notification.permission !== "denied") {
          Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
              new Notification(`New message from ${senderName}`, {
                body: `EAN: ${ean} - ${naziv}`,
                icon: "/react.svg",
              });
            }
          });
        }
      } catch {
        // Notification failed, continue silently
      }
    });

    return () => {
      socket?.off("newMessage");
    };
  }, [
    socket,
    messages,
    setMessages,
    conversations,
    selectedConversation,
    setConversations,
  ]);
};

export default useListenMessages;
