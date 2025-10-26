import Message from "../models/message.js";
import User from "../models/user.model.js";
import Shop from "../models/shop.model.js";

// Get analytics for all shops (super_admin only)
export const getShopAnalytics = async (req, res) => {
  try {
    // Only super_admin can access this
    if (req.user.role !== "super_admin") {
      return res.status(403).json({
        error: "Only super_admin can access analytics",
      });
    }

    // Get all shops
    const shops = await Shop.find({ isActive: true }).sort({ name: 1 });

    const analytics = [];

    for (const shop of shops) {
      // Get all users from this shop
      const shopUsers = await User.find({ shopId: shop._id }).distinct("_id");

      // Internal warehouse requests (messages to warehouse role within the same shop)
      const internalRequests = await Message.find({
        shopId: shop._id,
        senderId: { $in: shopUsers },
        isExternalRequest: { $ne: true },
      });

      // Filter only messages sent to warehouseman users
      const internalWarehouseRequests = [];
      for (const msg of internalRequests) {
        const receiver = await User.findById(msg.receiverId);
        if (receiver && receiver.role === "warehouseman") {
          internalWarehouseRequests.push(msg);
        }
      }

      // Deduplicate internal requests (same sender + gigaId = same original request)
      // Messages forwarded to multiple warehousemen share the same gigaId
      const uniqueInternalRequests = [];
      const seenRequests = new Set();

      for (const msg of internalWarehouseRequests) {
        // Use gigaId if available, otherwise use buyer+seller combination within 5-second window
        // This handles cases where messages span across second boundaries
        const timeWindow = Math.floor(new Date(msg.createdAt).getTime() / 5000);
        const requestKey = msg.gigaId
          ? `${msg.senderId}_giga_${msg.gigaId}`
          : `${msg.senderId}_${msg.buyer}_${msg.sellerId}_${timeWindow}`;

        if (!seenRequests.has(requestKey)) {
          seenRequests.add(requestKey);
          uniqueInternalRequests.push(msg);
        }
      }

      // External warehouse requests (outgoing)
      const externalRequests = await Message.find({
        isExternalRequest: true,
        senderId: { $in: shopUsers },
      });

      // Calculate average response times for internal requests
      let internalResponseTimes = [];
      for (const msg of uniqueInternalRequests) {
        // Internal requests: use openedAt (when warehouse first opened the request)
        // Fallback to updatedAt for older messages that don't have openedAt
        const responseTimestamp =
          msg.openedAt || (msg.opened ? msg.updatedAt : null);

        if (responseTimestamp && msg.createdAt) {
          const responseTime =
            new Date(responseTimestamp) - new Date(msg.createdAt);
          // Only include positive response times
          if (responseTime > 0) {
            internalResponseTimes.push(responseTime);
          }
        }
      }

      // Calculate average response times for external requests
      let externalResponseTimes = [];
      for (const msg of externalRequests) {
        // External requests have statusHistory[0] = initial "pending",
        // statusHistory[1] = first actual response from warehouse
        if (msg.statusHistory && msg.statusHistory.length > 1) {
          const firstResponse = msg.statusHistory[1];
          if (firstResponse.updatedAt && msg.createdAt) {
            const responseTime =
              new Date(firstResponse.updatedAt) - new Date(msg.createdAt);
            // Only include positive response times
            if (responseTime > 0) {
              externalResponseTimes.push(responseTime);
            }
          }
        }
      }

      const avgInternalResponseTime =
        internalResponseTimes.length > 0
          ? internalResponseTimes.reduce((a, b) => a + b, 0) /
            internalResponseTimes.length
          : null;

      const avgExternalResponseTime =
        externalResponseTimes.length > 0
          ? externalResponseTimes.reduce((a, b) => a + b, 0) /
            externalResponseTimes.length
          : null;

      analytics.push({
        shopId: shop._id,
        shopName: shop.name,
        shopCode: shop.code,
        internalRequests: {
          total: uniqueInternalRequests.length,
          avgResponseTime:
            avgInternalResponseTime !== null ? avgInternalResponseTime : 0, // in milliseconds
          avgResponseTimeFormatted: formatDuration(avgInternalResponseTime),
        },
        externalRequests: {
          total: externalRequests.length,
          avgResponseTime:
            avgExternalResponseTime !== null ? avgExternalResponseTime : 0, // in milliseconds
          avgResponseTimeFormatted: formatDuration(avgExternalResponseTime),
        },
      });
    }

    res.status(200).json({ analytics });
  } catch (error) {
    console.error("Error fetching shop analytics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Helper function to format duration
function formatDuration(milliseconds) {
  // Handle null, undefined, 0, or negative values
  if (
    milliseconds === null ||
    milliseconds === undefined ||
    milliseconds <= 0
  ) {
    return "N/A";
  }

  const seconds = Math.floor(milliseconds / 1000);

  if (seconds < 1) {
    return "< 1s";
  }

  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}
