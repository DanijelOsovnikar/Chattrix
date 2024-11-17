import React from "react";

const Converastion = () => {
  return (
    <>
      <div className="flex gap-2 items-center hover:bg-slate-800 rounded p-2 cursor-pointer ">
        <div className="avatar online">
          <div className="w-12 rounded-full">
            <img src="" alt="profile icon" />
          </div>
        </div>
        <div className="flex flex-col flex-1 justify-between">
          <p className="font-bold text-gray-200 text-end">Username</p>
        </div>
      </div>
    </>
  );
};

export default Converastion;
