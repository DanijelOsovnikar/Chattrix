import Converastion from "./Converastion";
import useGetConversations from "../context/hooks/useGetConversations";
import useListenMessages from "../context/hooks/useListenMessages";
import useAssignedWarehouses from "../context/hooks/useAssignedWarehouses";
import {
  BsBuilding,
  BsShop,
  BsEye,
  BsChevronDown,
  BsChevronUp,
} from "react-icons/bs";
import useConversation from "../store/useConversation";
import { useAuthContext } from "../context/AuthContext";
import { useState, useEffect } from "react";

const Conversations = () => {
  const { loading, conversations } = useGetConversations();
  const { assignedWarehouses, loading: warehousesLoading } =
    useAssignedWarehouses();
  const {
    setSelectedConversation,
    selectedConversation,
    setIsExternalWarehouse,
  } = useConversation();
  const { authUser } = useAuthContext();

  // State for collapsible sections
  const [isInternalExpanded, setIsInternalExpanded] = useState(true);
  const [isExternalWarehousesExpanded, setIsExternalWarehousesExpanded] =
    useState(true);
  const [isExternalRequestsExpanded, setIsExternalRequestsExpanded] =
    useState(true);
  const [newExternalShops, setNewExternalShops] = useState(new Set());

  useListenMessages();

  // Listen for new external messages to highlight shops
  useEffect(() => {
    const handleNewMessage = (event) => {
      const newMessage = event.detail;

      // Check if it's an external request from a shop
      if (newMessage.isExternalRequest && newMessage.senderId?.shopId) {
        const shopId = `external_shop_${newMessage.senderId.shopId}`;

        // Only highlight if not currently viewing this conversation
        if (selectedConversation?._id !== shopId) {
          setNewExternalShops((prev) => new Set(prev).add(shopId));
        }
      }
    };

    window.addEventListener("conversationNewMessage", handleNewMessage);

    return () => {
      window.removeEventListener("conversationNewMessage", handleNewMessage);
    };
  }, [selectedConversation]);

  // Handle external warehouse selection
  const handleExternalWarehouseClick = (warehouse) => {
    // Create a special conversation object for external warehouse
    const externalConversation = {
      _id: `external_${warehouse._id}`,
      fullName: warehouse.name,
      code: warehouse.code,
      isExternal: true,
      warehouseId: warehouse._id,
    };

    setSelectedConversation(externalConversation);
    setIsExternalWarehouse(true);
  };

  // Handle internal conversation selection
  const handleInternalConversationClick = (conversation) => {
    setSelectedConversation(conversation);
    setIsExternalWarehouse(false);

    // Clear highlight when viewing the conversation
    if (newExternalShops.has(conversation._id)) {
      setNewExternalShops((prev) => {
        const updated = new Set(prev);
        updated.delete(conversation._id);
        return updated;
      });
    }
  };

  // Handle tracking conversation selection (for managers)
  const handleTrackingConversationClick = () => {
    const trackingConversation = {
      _id: `tracking_outgoing_requests`,
      fullName: "Outgoing Requests",
      isTrackingView: true,
    };

    setSelectedConversation(trackingConversation);
    setIsExternalWarehouse(false);
  };

  return (
    <div className="py-2 flex flex-col overflow-auto convCLass">
      {/* Internal Shop Conversations */}
      <div className="mb-4">
        <div
          className="flex items-center justify-between gap-2 px-3 py-2 text-sm font-semibold text-base-content/70 bg-base-200/50 rounded cursor-pointer hover:bg-base-200/70 transition-colors"
          onClick={() => setIsInternalExpanded(!isInternalExpanded)}
        >
          <div className="flex items-center gap-2">
            <BsShop className="w-4 h-4" />
            <span>Internal Warehouse</span>
          </div>
          {isInternalExpanded ? (
            <BsChevronUp className="w-4 h-4" />
          ) : (
            <BsChevronDown className="w-4 h-4" />
          )}
        </div>
        <div
          className={`mt-1 transition-all duration-300 ease-in-out overflow-hidden ${
            isInternalExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="max-h-80 overflow-y-auto">
            {conversations
              .filter((conv) => !conv.isExternalShop)
              .map((conversation) => (
                <div
                  key={conversation._id || conversation.fullName}
                  onClick={() => handleInternalConversationClick(conversation)}
                  className="cursor-pointer"
                >
                  <Converastion
                    conversation={conversation}
                    isClickable={false}
                  />
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* External Shops (for warehousemen receiving requests) */}
      {conversations.filter((conv) => conv.isExternalShop).length > 0 && (
        <div className="mb-4">
          <div
            className="flex items-center justify-between gap-2 px-3 py-2 text-sm font-semibold text-base-content/70 bg-base-200/50 rounded cursor-pointer hover:bg-base-200/70 transition-colors"
            onClick={() =>
              setIsExternalRequestsExpanded(!isExternalRequestsExpanded)
            }
          >
            <div className="flex items-center gap-2">
              <BsShop className="w-4 h-4" />
              <span>External Requests</span>
            </div>
            {isExternalRequestsExpanded ? (
              <BsChevronUp className="w-4 h-4" />
            ) : (
              <BsChevronDown className="w-4 h-4" />
            )}
          </div>
          <div
            className={`mt-1 transition-all duration-300 ease-in-out overflow-hidden ${
              isExternalRequestsExpanded
                ? "max-h-96 opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            <div className="max-h-80 overflow-y-auto">
              {conversations
                .filter((conv) => conv.isExternalShop)
                .map((shop) => {
                  const hasNewMessage = newExternalShops.has(shop._id);
                  return (
                    <div
                      key={shop._id}
                      onClick={() => handleInternalConversationClick(shop)}
                      className={`flex gap-2 items-center hover:bg-base-300 rounded p-2 py-1 cursor-pointer transition-colors relative
                      ${
                        selectedConversation?._id === shop._id
                          ? "bg-base-300"
                          : hasNewMessage
                          ? "bg-yellow-500/10 border-l-4 border-yellow-500"
                          : ""
                      }
                    `}
                    >
                      <div className="avatar placeholder">
                        <div
                          className={`bg-secondary text-secondary-content rounded-full w-8 ${
                            hasNewMessage
                              ? "ring-2 ring-yellow-500 ring-offset-2 ring-offset-base-100"
                              : ""
                          }`}
                        >
                          <span className="text-xs">
                            {shop.code?.charAt(0) || "S"}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex gap-3 justify-between items-center">
                          <p className="font-bold text-base-content text-sm truncate">
                            {shop.fullName}
                          </p>
                          {hasNewMessage && (
                            <span className="badge badge-warning badge-sm">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-base-content/60 truncate">
                          {shop.code} • External Shop
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* External Warehouses (hidden for warehouseman) */}
      {assignedWarehouses.length > 0 && authUser?.role !== "warehouseman" && (
        <div className="mb-4">
          <div
            className="flex items-center justify-between gap-2 px-3 py-2 text-sm font-semibold text-base-content/70 bg-base-200/50 rounded cursor-pointer hover:bg-base-200/70 transition-colors"
            onClick={() =>
              setIsExternalWarehousesExpanded(!isExternalWarehousesExpanded)
            }
          >
            <div className="flex items-center gap-2">
              <BsBuilding className="w-4 h-4" />
              <span>External Warehouses</span>
            </div>
            {isExternalWarehousesExpanded ? (
              <BsChevronUp className="w-4 h-4" />
            ) : (
              <BsChevronDown className="w-4 h-4" />
            )}
          </div>
          <div
            className={`mt-1 transition-all duration-300 ease-in-out overflow-hidden ${
              isExternalWarehousesExpanded
                ? "max-h-96 opacity-100"
                : "max-h-0 opacity-0"
            }`}
          >
            <div className="max-h-80 overflow-y-auto">
              {warehousesLoading ? (
                <div className="flex justify-center py-2">
                  <span className="loading loading-spinner loading-sm"></span>
                </div>
              ) : (
                assignedWarehouses.map((warehouse) => (
                  <div
                    key={warehouse._id}
                    onClick={() => handleExternalWarehouseClick(warehouse)}
                    className={`flex gap-2 items-center hover:bg-base-300 rounded p-2 py-1 cursor-pointer transition-colors
                      ${
                        selectedConversation?.warehouseId === warehouse._id
                          ? "bg-base-300"
                          : ""
                      }
                    `}
                  >
                    <div className="avatar placeholder">
                      <div className="bg-primary text-primary-content rounded-full w-8">
                        <span className="text-xs">
                          {warehouse.code?.charAt(0) || "W"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex gap-3 justify-between">
                        <p className="font-bold text-base-content text-sm truncate">
                          {warehouse.name}
                        </p>
                      </div>
                      <p className="text-xs text-base-content/60 truncate">
                        {warehouse.code} • External
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* External Request Tracking (for managers, admins, cashiers, and super_admins) */}
      {(authUser?.role === "manager" ||
        authUser?.role === "admin" ||
        authUser?.role === "cashier" ||
        authUser?.role === "super_admin") && (
        <div className="mb-4">
          <div className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-base-content/70 bg-base-200/50 rounded">
            <BsEye className="w-4 h-4" />
            <span>Track External Requests</span>
          </div>
          <div className="mt-1">
            <div
              onClick={handleTrackingConversationClick}
              className={`flex gap-2 items-center hover:bg-base-300 rounded p-2 py-1 cursor-pointer transition-colors
                ${
                  selectedConversation?._id === "tracking_outgoing_requests"
                    ? "bg-base-300"
                    : ""
                }
              `}
            >
              <div className="avatar placeholder">
                <div className="bg-info text-info-content rounded-full w-8">
                  <span className="text-xs">📋</span>
                </div>
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex gap-3 justify-between">
                  <p className="font-bold text-base-content text-sm truncate">
                    Outgoing Requests
                  </p>
                </div>
                <p className="text-xs text-base-content/60 truncate">
                  Track external requests from your shop
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <span className="loading loading-spinner mx-auto"></span>
      ) : null}
    </div>
  );
};

export default Conversations;
