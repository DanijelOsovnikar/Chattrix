// import SearchInput from "./SearchInput";
import Conversations from "./Conversations";

const Sidebar = () => {
  return (
    <div className="flex flex-col justify-between border-r border-slate-500 sidebar">
      <div className="wrapper sm:overflow-y-scroll">
        {/* <SearchInput /> */}
        <Conversations />
      </div>
    </div>
  );
};

export default Sidebar;
