import PropTypes from "prop-types";
import { useState } from "react";
import { formatMessageTime } from "../../utils/formatTime";

const TrackingView = ({ messages }) => {
  const [filter, setFilter] = useState("all"); // 'all', 'outgoing', 'incoming'
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'pending', 'sending', 'keeping', 'rejected'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter only external requests
  const externalRequests = messages.filter(
    (message) => message.isExternalRequest === true
  );

  // Apply direction filter
  const directionFilteredRequests = externalRequests.filter((request) => {
    if (filter === "all") return true;
    return request.direction === filter;
  });

  // Apply status filter
  const filteredRequests = directionFilteredRequests.filter((request) => {
    if (statusFilter === "all") return true;
    return request.externalStatus === statusFilter;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  // Reset to first page when filters change
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (newStatusFilter) => {
    setStatusFilter(newStatusFilter);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "text-yellow-500";
      case "accepted":
        return "text-green-500";
      case "rejected":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return "⏳";
      case "accepted":
        return "✅";
      case "rejected":
        return "❌";
      default:
        return "⏳";
    }
  };

  return (
    <div className="px-4 flex-1 overflow-auto">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
          External Requests Management
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Track all external requests - both sent and received
        </p>
      </div>

      {/* Filter Controls */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Direction Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Request Direction
            </label>
            <select
              value={filter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Requests</option>
              <option value="outgoing">📤 Outgoing (We Send)</option>
              <option value="incoming">📥 Incoming (We Receive)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Request Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Statuses</option>
              <option value="pending">⏳ Pending</option>
              <option value="sending">📤 Sending</option>
              <option value="keeping">📦 Keeping</option>
              <option value="rejected">❌ Rejected</option>
            </select>
          </div>

          {/* Items Per Page */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Items Per Page
            </label>
            <select
              value={itemsPerPage}
              onChange={(e) =>
                handleItemsPerPageChange(parseInt(e.target.value))
              }
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-3 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
          <div>
            Showing {startIndex + 1}-
            {Math.min(endIndex, filteredRequests.length)} of{" "}
            {filteredRequests.length} requests
            {filteredRequests.length !== externalRequests.length && (
              <span className="ml-1">({externalRequests.length} total)</span>
            )}
          </div>
          {totalPages > 1 && (
            <div>
              Page {currentPage} of {totalPages}
            </div>
          )}
        </div>
      </div>

      {filteredRequests.length > 0 ? (
        <>
          <div className="space-y-4">
            {paginatedRequests.map((request) => (
              <div
                key={request._id}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700"
              >
                {/* Direction Badge */}
                <div className="mb-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          request.direction === "outgoing"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        }`}
                      >
                        {request.direction === "outgoing"
                          ? "📤 OUTGOING"
                          : "📥 INCOMING"}
                      </span>
                      <span className="text-lg">
                        {getStatusIcon(request.externalStatus)}
                      </span>
                      <span
                        className={`font-semibold ${getStatusColor(
                          request.externalStatus
                        )}`}
                      >
                        {request.externalStatus?.toUpperCase() || "PENDING"}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 sm:ml-auto">
                      {formatMessageTime(request.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  {request.direction === "outgoing" ? (
                    <>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <strong>From:</strong>{" "}
                        {request.senderId?.fullName || "Unknown"} (Our Employee)
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <strong>To:</strong>{" "}
                        {request.receiverId?.fullName || "External Warehouse"}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <strong>From:</strong>{" "}
                        {request.senderId?.fullName || "External Shop"}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <strong>To:</strong>{" "}
                        {request.receiverId?.fullName || "Unknown"} (Our
                        Employee)
                      </div>
                    </>
                  )}
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <strong>Order Number:</strong>{" "}
                    {request.orderNumber || "N/A"}
                  </div>
                  {request.nalog && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <strong>📋 Nalog:</strong>{" "}
                      <span className="text-green-600 dark:text-green-400 font-semibold">
                        {request.nalog}
                      </span>
                    </div>
                  )}
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <strong>Buyer:</strong> {request.buyer || "N/A"}
                  </div>
                  {request.buyerName && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <strong>Buyer Name:</strong> {request.buyerName}
                    </div>
                  )}
                </div>

                <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  <div className="font-semibold mb-1">Products:</div>
                  {request.messages && request.messages.length > 0 ? (
                    <div className="space-y-1">
                      {request.messages.map((product, idx) => (
                        <div key={idx} className="text-xs">
                          {product.naziv} (EAN: {product.ean}) - Qty:{" "}
                          {product.qty}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs">No product details</div>
                  )}
                </div>

                {request.statusHistory &&
                  request.statusHistory.length > 0 &&
                  request.statusHistory[request.statusHistory.length - 1]
                    .notes && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
                      Status:{" "}
                      {
                        request.statusHistory[request.statusHistory.length - 1]
                          .notes
                      }
                    </div>
                  )}
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center gap-2">
              {/* Previous Button */}
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  currentPage === 1
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                }`}
              >
                Previous
              </button>

              {/* Page Numbers */}
              <div className="flex gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        currentPage === pageNum
                          ? "bg-primary text-primary-content"
                          : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Button */}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  currentPage === totalPages
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                }`}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-semibold mb-2">No Matching Requests</h3>
          <p className="text-sm">
            {externalRequests.length === 0
              ? "No external requests found. When requests are sent or received, they will appear here."
              : "No requests match the current filters. Try adjusting the direction or status filters above."}
          </p>
        </div>
      )}
    </div>
  );
};

TrackingView.propTypes = {
  messages: PropTypes.array.isRequired,
};

export default TrackingView;
