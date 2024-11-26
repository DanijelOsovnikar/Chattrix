import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import { useAuthContext } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import QrCodeScanner from "./components/Messages/qrCodeScanner";
import useConversations from "./store/useConversation";

function App() {
  const { authUser } = useAuthContext();
  const { qrCode, qrCodeName } = useConversations();

  return (
    <div className="mainWrapper flex justify-center">
      <Routes>
        <Route
          path="/"
          element={authUser ? <Home /> : <Navigate to="/login" />}
        />
        <Route
          path="/login"
          element={authUser ? <Navigate to="/" /> : <Login />}
        />
      </Routes>
      <Toaster />
      {qrCode ? <QrCodeScanner /> : null}
      {qrCodeName ? <QrCodeScanner /> : null}
    </div>
  );
}

export default App;
