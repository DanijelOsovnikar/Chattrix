import { useEffect } from "react";
import { useSocketContext } from "../SocketContext";
import useConversations from "../../store/useConversation";
import useGetConversations from "./useGetConversations";
import addNotification from "react-push-notification";

import notificationSound from "../../assets/notification.mp3";

const useListenMessages = () => {
  const { socket } = useSocketContext();
  const { messages, setMessages, setConversationss } = useConversations();
  const { conversations } = useGetConversations();

  useEffect(() => {
    socket?.on("newMessage", (newMessage) => {
      const sound = new Audio(notificationSound);
      sound.play();
      const sender = newMessage.senderId;

      let currConversation = {};

      for (let i of conversations) {
        if (i._id === sender) {
          currConversation = i;
        }
      }

      let copyOfConversations = [...conversations].filter(
        (e) => e._id !== currConversation._id
      );
      copyOfConversations.unshift(currConversation);

      setConversationss(copyOfConversations);

      addNotification({
        title: "Poruka od " + currConversation.fullName,
        subtitle: newMessage.ean,
        message: newMessage.productName,
        theme: "darkblue",
      });

      // alert(currConversation.fullName);
      setMessages([...messages, newMessage]);
    });

    return () => socket?.off("newMessage");
  }, [socket, messages, setMessages]);
};

export default useListenMessages;
