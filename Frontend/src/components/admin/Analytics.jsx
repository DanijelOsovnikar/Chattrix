import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  BsClockHistory,
  BsBoxSeam,
  BsBuilding,
  BsArrowRepeat,
} from "react-icons/bs";

const Analytics = () => {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("shopName"); // shopName, internalTotal, externalTotal, internalTime, externalTime

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/analytics/shops", {
        credentials: "include",
      });

      const data = await res.json();

      if (res.ok) {
        setAnalytics(data.analytics || []);
      } else {
        throw new Error(data.error || "Failed to fetch analytics");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getSortedAnalytics = () => {
    const sorted = [...analytics];

    switch (sortBy) {
      case "shopName":
        return sorted.sort((a, b) => a.shopName.localeCompare(b.shopName));
      case "internalTotal":
        return sorted.sort(
          (a, b) => b.internalRequests.total - a.internalRequests.total
        );
      case "externalTotal":
        return sorted.sort(
          (a, b) => b.externalRequests.total - a.externalRequests.total
        );
      case "internalTime":
        return sorted.sort(
          (a, b) =>
            b.internalRequests.avgResponseTime -
            a.internalRequests.avgResponseTime
        );
      case "externalTime":
        return sorted.sort(
          (a, b) =>
            b.externalRequests.avgResponseTime -
            a.externalRequests.avgResponseTime
        );
      default:
        return sorted;
    }
  };

  const sortedAnalytics = getSortedAnalytics();

  const totalInternalRequests = analytics.reduce(
    (sum, shop) => sum + shop.internalRequests.total,
    0
  );
  const totalExternalRequests = analytics.reduce(
    (sum, shop) => sum + shop.externalRequests.total,
    0
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-primary">Shop Analytics</h2>
          <p className="text-sm text-base-content/60 mt-1">
            Performance metrics for all shops
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="btn btn-primary btn-sm gap-2"
          disabled={loading}
        >
          <BsArrowRepeat className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat bg-base-200 rounded-lg shadow">
          <div className="stat-figure text-primary">
            <BsBuilding className="w-8 h-8" />
          </div>
          <div className="stat-title">Total Shops</div>
          <div className="stat-value text-primary">{analytics.length}</div>
        </div>

        <div className="stat bg-base-200 rounded-lg shadow">
          <div className="stat-figure text-info">
            <BsBoxSeam className="w-8 h-8" />
          </div>
          <div className="stat-title">Internal Requests</div>
          <div className="stat-value text-info">{totalInternalRequests}</div>
        </div>

        <div className="stat bg-base-200 rounded-lg shadow">
          <div className="stat-figure text-secondary">
            <BsBoxSeam className="w-8 h-8" />
          </div>
          <div className="stat-title">External Requests</div>
          <div className="stat-value text-secondary">
            {totalExternalRequests}
          </div>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex gap-4 items-center bg-base-200 p-4 rounded-lg">
        <span className="font-semibold">Sort by:</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="select select-bordered select-sm"
        >
          <option value="shopName">Shop Name</option>
          <option value="internalTotal">Internal Requests (Most)</option>
          <option value="externalTotal">External Requests (Most)</option>
          <option value="internalTime">Internal Response Time (Slowest)</option>
          <option value="externalTime">External Response Time (Slowest)</option>
        </select>
      </div>

      {/* Analytics Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : analytics.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-base-content/60">No analytics data available</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-lg shadow">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Shop</th>
                <th className="text-center">
                  <div className="flex flex-col items-center">
                    <span>Internal Requests</span>
                    <span className="text-xs font-normal text-base-content/60">
                      (To Local Warehouse)
                    </span>
                  </div>
                </th>
                <th className="text-center">
                  <div className="flex flex-col items-center">
                    <span>Avg Response Time</span>
                    <span className="text-xs font-normal text-base-content/60">
                      (Internal)
                    </span>
                  </div>
                </th>
                <th className="text-center">
                  <div className="flex flex-col items-center">
                    <span>External Requests</span>
                    <span className="text-xs font-normal text-base-content/60">
                      (To External Warehouses)
                    </span>
                  </div>
                </th>
                <th className="text-center">
                  <div className="flex flex-col items-center">
                    <span>Avg Response Time</span>
                    <span className="text-xs font-normal text-base-content/60">
                      (External)
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedAnalytics.map((shop) => (
                <tr key={shop.shopId}>
                  <td>
                    <div className="flex items-center gap-2">
                      <BsBuilding className="text-primary" />
                      <div>
                        <div className="font-bold">{shop.shopName}</div>
                        <div className="text-sm text-base-content/60">
                          {shop.shopCode}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="text-center">
                    <div className="badge badge-info badge-lg">
                      {shop.internalRequests.total}
                    </div>
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <BsClockHistory className="text-info" />
                      <span
                        className={
                          shop.internalRequests.avgResponseTime === 0
                            ? "text-base-content/40"
                            : "font-semibold"
                        }
                      >
                        {shop.internalRequests.avgResponseTimeFormatted}
                      </span>
                    </div>
                  </td>
                  <td className="text-center">
                    <div className="badge badge-secondary badge-lg">
                      {shop.externalRequests.total}
                    </div>
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <BsClockHistory className="text-secondary" />
                      <span
                        className={
                          shop.externalRequests.avgResponseTime === 0
                            ? "text-base-content/40"
                            : "font-semibold"
                        }
                      >
                        {shop.externalRequests.avgResponseTimeFormatted}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info Box */}
      <div className="alert alert-info">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="stroke-current shrink-0 w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <div className="text-sm">
          <p className="font-semibold">About Response Times:</p>
          <p>
            Response time is measured from when a request is created until the
            first status update by a warehouseman. &quot;N/A&quot; means no
            status updates have been made yet.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
