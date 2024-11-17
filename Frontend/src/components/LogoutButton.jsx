import React from "react";
import { BiLogOut } from "react-icons/bi";

const LogoutButton = () => {
  return (
    <button className="w-8 h-8 text-white cursor-pointer">
      <BiLogOut />
    </button>
  );
};

export default LogoutButton;
