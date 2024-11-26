import { create } from "zustand";

const useConversations = create((set) => ({
  selectedConversation: null,
  setSelectedConversation: (selectedConversation) =>
    set({ selectedConversation }),
  messages: [],
  setMessages: (messages) => set({ messages }),
  qrCode: false,
  setQrCode: (qrCode) => set({ qrCode }),
  scannerResult: "",
  setScannerResult: (scannerResult) => set({ scannerResult }),
  qrCodeName: false,
  setQrCodeName: (qrCodeName) => set({ qrCodeName }),
  scannerResultName: "",
  setScannerResultName: (scannerResultName) => set({ scannerResultName }),
}));

export default useConversations;
