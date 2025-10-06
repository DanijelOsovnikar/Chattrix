import { createContext, useContext, useState } from "react";
import PropTypes from "prop-types";

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

CoversationContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
