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
    socket?.on("newMessage", (newMessage) => {
      const sound = new Audio(notificationSound);
      sound.play();
      const sender = newMessage.senderId;

      const currConversation = conversations.find((i) => i._id === sender);

      if (currConversation) {
        const updatedConversations = [
          currConversation,
          ...conversations.filter((e) => e._id !== currConversation._id),
        ];
        setConversations(updatedConversations);

        if ("Notification" in window) {
          alert("This browser does not support desktop notifications.");
        }

        try {
          if (Notification.permission === "granted") {
            new Notification("Test Notification", {
              body: "This is a test notification.",
            });
          }
        } catch (err) {
          console.error("Error with notification:", err);
        }

        // if (Notification.permission === "granted") {
        //   new Notification("Poruka od " + currConversation.fullName, {
        //     body: newMessage.productName,
        //   });
        // } else if (Notification.permission !== "denied") {
        //   Notification.requestPermission().then((permission) => {
        //     if (permission === "granted") {
        //       new Notification("Poruka od " + currConversation.fullName, {
        //         body: newMessage.productName,
        //       });
        //     }
        //   });
        // } else {
        //   console.error("Notification permission denied.");
        // }
      }

      setMessages([...messages, newMessage]);
    });

    return () => socket?.off("newMessage");
  }, [socket, messages, setMessages, conversations]);
};

export default useListenMessages;
