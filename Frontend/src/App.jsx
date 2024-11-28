import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import { useAuthContext } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import useConversations from "./store/useConversation";
import QrCodeScanner from "./components/Messages/QrCodeScanner";
import { IoClose } from "react-icons/io5";

function App() {
  const { authUser } = useAuthContext();
  const { qrCode, qrCodeName, setQrCode, setQrCodeName } = useConversations();

  const closeHandler = () => {
    if (qrCode) {
      setQrCode(false);
    }
    if (qrCodeName) {
      setQrCodeName(false);
    }
  };

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
      {qrCode ? <QrCodeScanner /> : null}
      {qrCodeName ? <QrCodeScanner /> : null}
      {qrCode || qrCodeName ? <div className="overlay"></div> : null}
      {qrCode || qrCodeName ? (
        <div className="close" onClick={closeHandler}>
          <IoClose />
        </div>
      ) : null}
      <Toaster />
    </div>
  );
}

export default App;
