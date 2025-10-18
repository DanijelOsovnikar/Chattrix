import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import useConversations from "../store/useConversation";
import { useAuthContext } from "../context/AuthContext";
import { useSocketContext } from "../context/SocketContext";

const Converastion = ({ conversation }) => {
  const { selectedConversation, setSelectedConversation } = useConversations();
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const isSelected = selectedConversation?._id === conversation._id;

  const { authUser } = useAuthContext();
  const { onlineUsers } = useSocketContext();

  const isOnline = onlineUsers.includes(conversation._id);

  // Listen for new messages for this conversation
  useEffect(() => {
    // console.log(`🔌 Setting up custom event listener for ${conversation.fullName}`);

    const handleNewMessage = (event) => {
      const newMessage = event.detail;
      // console.log(`🔔 [${conversation.fullName}] Received custom message event:`, {
      //   messageId: newMessage._id,
      //   senderId:
      //     typeof newMessage.senderId === "object"
      //       ? newMessage.senderId._id
      //       : newMessage.senderId,
      //   receiverId: newMessage.receiverId,
      //   conversationId: conversation._id,
      //   isSelected: isSelected,
      // });

      // Handle both populated and non-populated senderId
      const senderId =
        typeof newMessage.senderId === "object"
          ? newMessage.senderId._id
          : newMessage.senderId;

      // This conversation should highlight if:
      // 1. The message is FROM this user (senderId matches this conversation's user ID)
      // 2. AND this conversation is not currently selected
      // This means: when User A sends a message, highlight User A in the sidebar
      if (senderId === conversation._id && !isSelected) {
        // console.log(
        //   `✅ [${conversation.fullName}] Highlighting - message from this user`
        // );
        setHasNewMessage(true);
      } else {
        // console.log(`❌ [${conversation.fullName}] Not highlighting:`, {
        //   senderMatches: senderId === conversation._id,
        //   notSelected: !isSelected,
        //   reason:
        //     senderId !== conversation._id
        //       ? "sender doesn't match"
        //       : "conversation is selected",
        // });
      }
    };

    const handlePushNotification = (event) => {
      // console.log(
      //   `💬 Conversation ${conversation.fullName}: Received push notification event`,
      //   event.detail
      // );
      // console.log(
      //   `💬 Conversation ${conversation.fullName}: Current isSelected = ${isSelected}`
      // );

      const notificationData = event.detail.notificationData;
      const senderId = notificationData.senderId;

      // console.log(
      //   `💬 Conversation ${conversation.fullName}: Push notification from senderId: ${senderId}, my conversation._id: ${conversation._id}`
      // );

      // Only highlight if this conversation matches the sender and is not currently selected
      if (senderId && senderId === conversation._id && !isSelected) {
        // console.log(
        //   `💬 Conversation ${conversation.fullName}: This is the sender! Setting hasNewMessage = true`
        // );
        setHasNewMessage(true);
      } else {
        // console.log(
        //   `💬 Conversation ${conversation.fullName}: Not the sender or selected, ignoring`
        // );
      }
    };

    // Listen for custom message events (instead of direct socket events)
    window.addEventListener("conversationNewMessage", handleNewMessage);

    // Listen for push notifications
    window.addEventListener("pushNotificationReceived", handlePushNotification);

    return () => {
      window.removeEventListener("conversationNewMessage", handleNewMessage);
      window.removeEventListener(
        "pushNotificationReceived",
        handlePushNotification
      );
    };
  }, [conversation._id, conversation.fullName, isSelected]);

  // Clear notification when conversation is selected
  useEffect(() => {
    if (isSelected) {
      // console.log(
      //   `Clearing hasNewMessage for selected conversation: ${conversation.fullName}`
      // );
      setHasNewMessage(false);
    }
  }, [isSelected, conversation.fullName]);

  // Debug logging for hasNewMessage state
  useEffect(() => {
    // console.log(
    //   `Conversation ${conversation.fullName}: hasNewMessage = ${hasNewMessage}, isSelected = ${isSelected}`
    // );
  }, [hasNewMessage, isSelected, conversation.fullName]);

  return (
    <>
      <div
        className={`flex gap-2 mb-2 items-center hover:bg-neutral transition-all duration-100 rounded p-2 cursor-pointer relative ${
          isSelected ? "bg-neutral" : hasNewMessage ? "bg-green-900" : ""
        }`}
        onClick={() => setSelectedConversation(conversation)}
      >
        <div className={`avatar ${isOnline ? "online" : ""}`}>
          <div className="w-12 rounded-full">
            <img
              src={
                authUser.fullName !== "Magacin" ? "/avatar.png" : "/avatar.png"
              }
              alt="profile icon"
            />
          </div>
        </div>
        <div className="flex flex-col flex-1 justify-between">
          <p
            className={`font-bold text-end ${
              hasNewMessage ? "text-green-300" : "text-base-content"
            }`}
          >
            {conversation.fullName}
          </p>
        </div>

        {/* New message indicator */}
        {hasNewMessage && (
          <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        )}
      </div>
    </>
  );
};

Converastion.propTypes = {
  conversation: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    fullName: PropTypes.string.isRequired,
  }).isRequired,
};

export default Converastion;
