import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import AdminDashboard from "./pages/admin/AdminDashboard";
import { useAuthContext } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import useConversations from "./store/useConversation";
import usePushNotifications from "./context/hooks/usePushNotifications";
import useListenItemStatus from "./context/hooks/useListenItemStatus";
import QrCodeScanner from "./components/Messages/QrCodeScanner";
import { IoClose } from "react-icons/io5";

function App() {
  const { authUser } = useAuthContext();
  const {
    qrCode,
    qrCodeName,
    qrCodeKupac,
    setQrCode,
    setQrCodeName,
    setQrCodeKupac,
  } = useConversations();

  // Enable push notifications handling
  usePushNotifications();

  // Enable item status notifications
  useListenItemStatus();

  const closeHandler = () => {
    if (qrCode) {
      setQrCode(false);
    }
    if (qrCodeName) {
      setQrCodeName(false);
    }
    if (qrCodeKupac) {
      setQrCodeKupac(false);
    }
  };

  // Helper function to get default route based on role
  const getDefaultRoute = () => {
    if (!authUser) return "/login";

    switch (authUser.role) {
      case "super_admin":
        return "/admin"; // Super admin only gets admin panel
      case "admin":
        return "/admin"; // Admin gets admin panel by default, but can access messages
      case "warehouseman":
      case "employee":
      case "cashier":
      case "manager":
        return "/"; // Warehouseman, employee, cashier, and manager get messages
      default:
        return "/";
    }
  };

  return (
    <div className="mainWrapper flex justify-center min-h-screen">
      <Routes>
        <Route
          path="/"
          element={
            authUser ? (
              // Super admin and admin redirect to admin panel (messages are integrated there)
              ["super_admin", "admin"].includes(authUser.role) ? (
                <Navigate to="/admin" />
              ) : (
                // Warehouseman, employee, cashier, and manager get standalone messaging
                <Home />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/login"
          element={authUser ? <Navigate to={getDefaultRoute()} /> : <Login />}
        />
        <Route
          path="/admin"
          element={
            authUser && ["admin", "super_admin"].includes(authUser.role) ? (
              <AdminDashboard />
            ) : authUser ? (
              // Non-admin users trying to access admin are redirected to messages
              <Navigate to="/" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
      {qrCode ? <QrCodeScanner /> : null}
      {qrCodeName ? <QrCodeScanner /> : null}
      {qrCodeKupac ? <QrCodeScanner /> : null}
      {qrCode || qrCodeName || qrCodeKupac ? (
        <div className="overlay"></div>
      ) : null}
      {qrCode || qrCodeName || qrCodeKupac ? (
        <div className="close" onClick={closeHandler}>
          <IoClose />
        </div>
      ) : null}
      <Toaster />
    </div>
  );
}

export default App;
