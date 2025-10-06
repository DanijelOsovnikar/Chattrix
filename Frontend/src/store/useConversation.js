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
  activeScannerIndex: null,
  setActiveScannerIndex: (activeScannerIndex) => set({ activeScannerIndex }),
  scannerResultKupac: "",
  setScannerResultKupac: (scannerResultKupac) => set({ scannerResultKupac }),
  qrCodeKupac: false,
  setQrCodeKupac: (qrCodeKupac) => set({ qrCodeKupac }),
}));

export default useConversations;
