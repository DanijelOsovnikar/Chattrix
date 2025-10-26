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

      // Handle external conversation matching
      let isForCurrentConversation = false;

      if (selectedConversation) {
        if (selectedConversation._id.startsWith("external_")) {
          // For external warehouse conversations, check if this message is an external request
          // to the warehouse ID extracted from the conversation ID
          const targetWarehouseId = selectedConversation._id.replace(
            "external_",
            ""
          );
          isForCurrentConversation =
            newMessage.isExternalRequest &&
            newMessage.targetWarehouseId === targetWarehouseId;
        } else if (selectedConversation._id.startsWith("external_shop_")) {
          // For external shop conversations (warehousemen viewing shop requests)
          const externalShopId = selectedConversation._id.replace(
            "external_shop_",
            ""
          );
          isForCurrentConversation =
            newMessage.isExternalRequest &&
            (typeof newMessage.senderId === "object"
              ? newMessage.senderId.shopId === externalShopId
              : false);
        } else {
          // Regular internal conversations
          isForCurrentConversation =
            selectedConversation._id === senderId ||
            selectedConversation._id === receiverId;
        }
      }

      if (isForCurrentConversation) {
        const store = useConversations.getState();
        const currentMessages = store.messages;
        const setMessagesFunc = store.setMessages;

        if (!Array.isArray(currentMessages)) {
          setMessagesFunc([newMessage]);
        } else {
          // Check if message already exists to prevent duplicates
          const messageExists = currentMessages.some(
            (msg) => msg._id === newMessage._id
          );

          if (!messageExists) {
            const newMessagesArray = [...currentMessages, newMessage];
            setMessagesFunc(newMessagesArray);
          } else {
            // Message already exists, force a re-render with deduplicated array
            // This handles cases where duplicates sneak in
            const deduplicatedMessages = currentMessages.filter(
              (msg, index, self) =>
                index === self.findIndex((m) => m._id === msg._id)
            );
            if (deduplicatedMessages.length !== currentMessages.length) {
              setMessagesFunc(deduplicatedMessages);
            }
          }
        }
      }

      // Show notification with EAN and name
      try {
        let senderName =
          currConversation?.fullName ||
          newMessage.senderId?.fullName ||
          "Unknown User";

        // For external requests, include shop name
        if (newMessage.isExternalRequest && newMessage.senderShopName) {
          senderName = `${newMessage.senderShopName} - ${
            newMessage.senderId?.fullName || "Unknown"
          }`;
        }

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

    // Listen for external status updates
    socket?.on("externalStatusUpdate", (updateData) => {
      console.log("📊 Received external status update:", updateData);

      const store = useConversations.getState();
      const currentMessages = store.messages;
      const setMessagesFunc = store.setMessages;

      if (Array.isArray(currentMessages)) {
        // Find and update the message with new status
        const updatedMessages = currentMessages.map((msg) => {
          if (msg._id === updateData.messageId) {
            return {
              ...msg,
              externalStatus: updateData.externalStatus,
              lastUpdateDate: updateData.lastUpdateDate,
              statusHistory: updateData.statusHistory,
            };
          }
          return msg;
        });

        setMessagesFunc(updatedMessages);
      }
    });

    // Listen for nalog updates
    socket?.on("nalogUpdate", (updateData) => {
      console.log("📋 Received nalog update:", updateData);

      const store = useConversations.getState();
      const currentMessages = store.messages;
      const setMessagesFunc = store.setMessages;

      if (Array.isArray(currentMessages)) {
        // Find and update the message with new nalog
        const updatedMessages = currentMessages.map((msg) => {
          if (msg._id === updateData.messageId) {
            return {
              ...msg,
              nalog: updateData.nalog,
              lastUpdateDate: updateData.lastUpdateDate,
            };
          }
          return msg;
        });

        setMessagesFunc(updatedMessages);
      }
    });

    return () => {
      socket?.off("newMessage");
      socket?.off("externalStatusUpdate");
      socket?.off("nalogUpdate");
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
