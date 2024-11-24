import "./App.css";
import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import { useAuthContext } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import { useSubscribe } from "./context/hooks/useSubscribe";

function App() {
  const { authUser } = useAuthContext();
  const { subscribeToPushNotifications } = useSubscribe();

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Safe to register
      subscribeToPushNotifications();
    }
  }, []);

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
    </div>
  );
}

export default App;
