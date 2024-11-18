import React from "react";
import { BiLogOut } from "react-icons/bi";
import useLogout from "../context/hooks/useLogout";

const LogoutButton = () => {
  const { loading, logout } = useLogout();
  return (
    <button
      className=" searchBTN w-8 h-8 text-white cursor-pointer"
      onClick={logout}
    >
      <BiLogOut />
    </button>
  );
};

export default LogoutButton;
