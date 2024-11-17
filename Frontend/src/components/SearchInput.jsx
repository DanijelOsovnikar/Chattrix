import React from "react";
import { CiSearch } from "react-icons/ci";

const SearchInput = () => {
  return (
    <form className="flex items-center gap-2">
      <input
        type="text"
        placeholder="Search..."
        className="input input-bordered rounded-full"
      />
      <button
        type="submit"
        className="btn btn-circle bg-white text-black hover:text-white"
      >
        <CiSearch className="size-8" />
      </button>
    </form>
  );
};

export default SearchInput;
