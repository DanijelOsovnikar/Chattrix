import { createContext, useContext, useState } from "react";

export const CoversationContext = createContext();

export const useConversationContext = () => {
  return useContext(CoversationContext);
};

export const CoversationContextProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);

  return (
    <CoversationContext.Provider value={{ conversations, setConversations }}>
      {children}
    </CoversationContext.Provider>
  );
};
