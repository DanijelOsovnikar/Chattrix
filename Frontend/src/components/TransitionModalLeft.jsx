import { Transition } from "@headlessui/react";
import { Fragment } from "react";
import PropTypes from "prop-types";

export const TransitionModalLeft = ({ children }) => {
  return (
    <Transition.Child
      as={Fragment}
      enter="ease-out duration-100"
      enterFrom="opacity-0 -translate-x-6"
      enterTo="opacity-100 translate-x-0"
      leave="ease-in duration-100"
      leaveFrom="opacity-100 translate-x-0"
      leaveTo="opacity-0 -translate-x-6"
    >
      {children}
    </Transition.Child>
  );
};

TransitionModalLeft.propTypes = {
  children: PropTypes.node.isRequired,
};
