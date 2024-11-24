import { createContext, useEffect, useState, useContext } from "react";
import { useAuthContext } from "./AuthContext";
import io from "socket.io-client";

export const SocketContext = createContext();

export const useSocketContext = () => {
  return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { authUser } = useAuthContext();

  useEffect(() => {
    // If authUser is defined, initialize the socket connection
    if (authUser) {
      const socketInstance = io("http://localhost:3000", {
        query: { userId: authUser._id },
      });

      // Set the socket instance in state
      setSocket(socketInstance);

      // Join the specific room after connecting
      socketInstance.emit("joinRoom", {
        room: "group_67412fe4c9e8d92cc7b7f7fa",
      });

      // Handle online users update
      socketInstance.on("getOnlineUsers", (users) => {
        setOnlineUsers(users);
      });

      // Handle connection errors
      socketInstance.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });

      // Cleanup on unmount or authUser change
      return () => {
        console.log("Cleaning up socket...");
        if (socketInstance) {
          socketInstance.disconnect(); // Disconnect socket
        }
        setSocket(null); // Clear the socket state
      };
    } else {
      // If no authUser, ensure any existing socket is disconnected
      if (socket) {
        console.log("Disconnecting socket due to missing authUser...");
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [authUser]); // Re-run effect when authUser changes
  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
