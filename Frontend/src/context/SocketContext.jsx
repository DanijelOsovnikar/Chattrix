import { createContext, useEffect, useState, useContext } from "react";
import { useAuthContext } from "./AuthContext";
import io from "socket.io-client";
import PropTypes from "prop-types";

export const SocketContext = createContext();

export const useSocketContext = () => {
  return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { authUser } = useAuthContext();

  useEffect(() => {
    // If authUser is defined and has shopId, initialize the socket connection
    if (authUser && authUser.shopId) {
      // console.log("Initializing socket connection for user:", authUser._id);

      const socketInstance = io("http://localhost:3000", {
        query: { userId: authUser._id },
      });

      // Set the socket instance in state
      setSocket(socketInstance);

      // Join the shop-specific room dynamically
      const shopRoom = `shop_${authUser.shopId._id}`;
      socketInstance.emit("joinRoom", {
        room: shopRoom,
      });

      // Handle online users update (now shop-scoped)
      socketInstance.on("getOnlineUsers", (users) => {
        setOnlineUsers(users);
      });

      // Handle connection errors
      socketInstance.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });

      // Cleanup on unmount or authUser change
      return () => {
        // console.log("Cleaning up socket...");
        socketInstance.disconnect();
        setSocket(null);
        setOnlineUsers([]);
      };
    } else {
      // If no authUser or no shopId, clear socket and users
      setSocket(null);
      setOnlineUsers([]);
    }
  }, [authUser]); // Only depend on authUser changes

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

SocketContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
