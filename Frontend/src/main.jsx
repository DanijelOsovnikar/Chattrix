import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { AuthContextProvider } from "./context/AuthContext.jsx";
import { SocketContextProvider } from "./context/SocketContext.jsx";
import { CoversationContextProvider } from "./context/ConversationContext.jsx";
import { ThemeProvider } from "./components/ThemeProvider.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
  >
    <ThemeProvider>
      <AuthContextProvider>
        <SocketContextProvider>
          <CoversationContextProvider>
            <App />
          </CoversationContextProvider>
        </SocketContextProvider>
      </AuthContextProvider>
    </ThemeProvider>
  </BrowserRouter>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");

      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }
    } catch (error) {
      console.error("Service worker registration failed:", error);
    }
  });
}
