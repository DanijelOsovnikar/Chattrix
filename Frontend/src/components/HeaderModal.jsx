import PropTypes from "prop-types";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { TransitionModalBackground } from "../components/TransitionModalBackground";
import { TransitionModalLeft } from "../components/TransitionModalLeft";

export default function HeaderModal({ setIsModalOpen, isModalOpen, children }) {
  return (
    <Transition appear show={isModalOpen} as={Fragment}>
      <Dialog className={`relative z-50`} onClose={() => setIsModalOpen(false)}>
        <TransitionModalBackground />
        <TransitionModalLeft>
          <Dialog.Panel className="fixed inset-y-0 left-0 w-full max-w-[360px] overflow-hidden overflow-y-scroll overscroll-none rounded-r-lg bg-base-100 px-5 transition-all dark:bg-gpurple-950 dark:text-gpurple-50 dark:ring-1 dark:ring-gpurple-300/60">
            <div
              className={`sticky top-0 z-10 flex h-[62px] justify-between items-center border-b border-base-300 bg-base-100`}
            >
              <Dialog.Title className="text-lg font-semibold">
                Chattrix
              </Dialog.Title>
              <button
                className="my-2 p-3"
                type="button"
                onClick={() => setIsModalOpen(false)}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 18 18"
                  xmlns="http://www.w3.org/2000/svg"
                  className="fill-fill"
                >
                  <path d="M16.8438 15.293C17.3008 15.8008 17.3008 16.5625 16.8438 17.0195C16.3359 17.5273 15.5742 17.5273 15.1172 17.0195L9.125 10.9766L3.08203 17.0195C2.57422 17.5273 1.8125 17.5273 1.35547 17.0195C0.847656 16.5625 0.847656 15.8008 1.35547 15.293L7.39844 9.25L1.35547 3.20703C0.847656 2.69922 0.847656 1.9375 1.35547 1.48047C1.8125 0.972656 2.57422 0.972656 3.03125 1.48047L9.125 7.57422L15.168 1.53125C15.625 1.02344 16.3867 1.02344 16.8438 1.53125C17.3516 1.98828 17.3516 2.75 16.8438 3.25781L10.8008 9.25L16.8438 15.293Z" />
                </svg>
              </button>
            </div>

            <div className="pb-[20vh]">
              <div className="border-b border-base-300 dark:border-gpurple-800">
                <div className="flex justify-between">{children}</div>
              </div>
            </div>
          </Dialog.Panel>
        </TransitionModalLeft>
      </Dialog>
    </Transition>
  );
}

HeaderModal.propTypes = {
  setIsModalOpen: PropTypes.func.isRequired,
  isModalOpen: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
};
