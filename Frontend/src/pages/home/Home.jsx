import { useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import MessageContainer from "../../components/Messages/MessageContainer";
import { useSubscribe } from "../../context/hooks/useSubscribe.js";
import AdminButton from "../../components/AdminButton";
import ThemeSelector from "../../components/ThemeSelector";
import NotificationsButton from "../../components/NotificationsButton";
import { useAuthContext } from "../../context/AuthContext";
import useLogout from "../../context/hooks/useLogout";

const Home = () => {
  const { subscribeToPushNotifications } = useSubscribe();
  const { authUser } = useAuthContext();
  const { logout } = useLogout();

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      subscribeToPushNotifications();
    }
  }, [subscribeToPushNotifications]);

  return (
    <>
      <div className="flex flex-col w-full homeWrapper !p-4 rounded-lg overflow-hidden bg-gray-400 bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-0">
        <div className="flex justify-between items-start sm:items-center pt-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
            <p className="text-primary">Welcome back, {authUser.fullName}</p>
            <div className="text-sm text-primary">
              {authUser.shopId?.name
                ? `Shop: ${authUser.shopId.name}`
                : "No Shop"}
            </div>
          </div>
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content bg-base-200 text-base-content rounded-lg top-px h-96 max-h-fit w-40 overflow-y-auto shadow-2xl z-10"
              style={{ transform: "translateZ(0)", willChange: "transform" }}
            >
              <li className="p-2 pb-0">
                <AdminButton />
              </li>
              <li className="p-2 py-0">
                <ThemeSelector />
              </li>
              {authUser.role === "warehouseman" && (
                <li className="p-2 pt-0">
                  <NotificationsButton />
                </li>
              )}
              <li className="p-2 pt-0">
                {authUser.role !== "warehouseman" && (
                  <p className="text-sm mb-2">Settings:</p>
                )}

                <button
                  onClick={logout}
                  className="theme-controller btn btn-sm btn-block btn-ghost hover:bg-accenttext-accent-content justify-start"
                >
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="flex w-full mt-4 max-[700px]:flex-col">
          <Sidebar />
          <MessageContainer />
        </div>
      </div>
    </>
  );
};

export default Home;
