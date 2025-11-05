import Sidebar from "../../components/Sidebar";
import MessageContainer from "../../components/Messages/MessageContainer";
import AdminButton from "../../components/AdminButton";
import ThemeSelector from "../../components/ThemeSelector";
import NotificationsButton from "../../components/NotificationsButton";
import { useAuthContext } from "../../context/AuthContext";
import useLogout from "../../context/hooks/useLogout";
import { useState } from "react";
import HeaderModal from "../../components/HeaderModal";

const Home = () => {
  const { authUser } = useAuthContext();
  const { logout } = useLogout();

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col w-full homeWrapper !p-4 rounded-lg overflow-hidden bg-gray-400 bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-0">
        <div className="flex justify-between items-start sm:items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">Chattrix</h1>
            <p className="text-fill">Welcome back, {authUser.fullName}</p>
            <div className="text-sm text-fill">
              {authUser.shopId?.name
                ? `Shop: ${authUser.shopId.name}`
                : "No Shop"}
            </div>
          </div>
          <button
            className="-ml-2 w-fit min-w-[18px] p-3"
            type="button"
            name="Otvori meni"
            aria-label="Otvori meni"
            onClick={() => setIsModalOpen(true)}
          >
            <svg
              width="18"
              height="14"
              viewBox="0 0 18 14"
              fill="fill"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0 0.9375C0 0.429688 0.401786 0 0.964286 0H17.0357C17.558 0 18 0.429688 18 0.9375C18 1.48438 17.558 1.875 17.0357 1.875H0.964286C0.401786 1.875 0 1.48438 0 0.9375ZM0 7C0 6.49219 0.466071 6 1.02857 6H17.0357C17.558 6 18 6.49219 18 7C18 7.54688 17.558 8 17.0357 8H0.964286C0.401786 8 0 7.54688 0 7ZM17.0357 14H1.02857C0.466071 14 0 13.5469 0 13C0 12.4922 0.466071 12 1.02857 12H16.9714C17.4938 12 18 12.4922 18 13C18 13.5469 17.558 14 17.0357 14Z" />
            </svg>
          </button>
          <HeaderModal
            isModalOpen={isModalOpen}
            setIsModalOpen={setIsModalOpen}
          >
            <ul
              tabIndex={0}
              className="text-base-content size-full py-4"
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
                  className="theme-controller btn bg-error text-white btn-sm btn-block btn-ghost hover:bg-accenttext-accent-content justify-start"
                >
                  Logout
                </button>
              </li>
            </ul>
          </HeaderModal>
        </div>
        <div className="flex w-full max-[700px]:flex-col">
          <Sidebar />
          <MessageContainer />
        </div>
      </div>
    </>
  );
};

export default Home;
