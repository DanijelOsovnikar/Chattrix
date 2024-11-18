import { create } from "zustand";

const useConversations = create((set) => ({
  selectedConversation: null,
  setSelectedConversation: (selectedConversation) =>
    set({ selectedConversation }),
  messages: [],
  setMessages: (messages) => set({ messages }),
  conversationss: [],
  setConversationss: (conversationss) => set({ conversationss }),
}));

export default useConversations;
