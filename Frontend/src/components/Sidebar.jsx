import React from "react";
import SearchInput from "./SearchInput";
import Conversations from "./Conversations";
import LogoutButton from "./LogoutButton";
import NotificationsButton from "./NotificationsButton";

const Sidebar = () => {
  return (
    <div className="flex flex-col justify-between border-r border-slate-500 sidebar">
      <div className="wrapper">
        <SearchInput />
        <div className="diveder px-3 mt-4 mb-4 bg-gray-600 h-px"></div>
        <Conversations />
      </div>
      <LogoutButton />
      <NotificationsButton />
    </div>
  );
};

export default Sidebar;
