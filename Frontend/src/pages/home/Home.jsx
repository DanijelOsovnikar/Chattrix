import React from "react";
import Sidebar from "../../components/Sidebar";
import MessageContainer from "../../components/Messages/MessageContainer";

const Home = () => {
  return (
    <>
      <div className="flex sm:h-[650px] md:h[850px] p-4 rounded-lg overflow-hidden bg-gray-400 bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-0">
        <Sidebar />
        <MessageContainer />
      </div>
    </>
  );
};

export default Home;
