import { Transition } from "@headlessui/react";
import { Fragment } from "react";
import PropTypes from "prop-types";

export const TransitionModalFade = ({ children }) => {
  return (
    <Transition.Child
      as={Fragment}
      enter="ease-out duration-100"
      enterFrom="opacity-0 translate-y-4"
      enterTo="opacity-100 translate-y-0"
      leave="ease-in duration-100"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 translate-y-4"
    >
      {children}
    </Transition.Child>
  );
};

TransitionModalFade.propTypes = {
  children: PropTypes.node.isRequired,
};
