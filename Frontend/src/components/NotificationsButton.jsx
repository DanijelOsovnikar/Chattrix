import { useAuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";

const NotificationsButton = () => {
  const { authUser } = useAuthContext();

  const offHandler = async () => {
    try {
      const res = await fetch(`/api/deleteSubsription/${authUser._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      toast(data.message);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <p className="text-sm mb-2">Settings:</p>
      <button
        className="btn btn-sm btn-block btn-ghost justify-start"
        onClick={offHandler}
      >
        Notification Off
      </button>
    </>
  );
};

export default NotificationsButton;
