import { useRef, useState, useEffect } from "react";
import useConversation from "../../store/useConversation";
import { useAuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";
import QRCodeSVG from "qrcode-svg";
import PropTypes from "prop-types";
import { validate as isUUID } from "uuid";

const Message = ({ message }) => {
  const { authUser } = useAuthContext();
  const { selectedConversation } = useConversation();
  const iframeRef = useRef(null);
  const [color, setColor] = useState(message.opened);
  const [nalogValue, setNalogValue] = useState(message.nalog || "");

  // Sync nalog value when message updates via socket
  useEffect(() => {
    if (message.nalog !== undefined) {
      setNalogValue(message.nalog);
    }
  }, [message.nalog]);

  const fromMe =
    message.senderId?._id === authUser._id || message.senderId === authUser._id;
  const chatClassName = fromMe ? "chat-end" : "chat-start";

  const bgColor = fromMe
    ? message.opened || color
      ? "bg-green-500"
      : "bg-blue-500"
    : message.opened || color
    ? "bg-pink-500"
    : "";
  const formatedTime = extractTime(message.createdAt);

  const handleNalogUpdate = async (messageId) => {
    try {
      const res = await fetch(`/api/messages/${messageId}/nalog`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nalog: nalogValue,
        }),
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      toast.success("Nalog updated successfully");
      // The message will be updated via socket event
    } catch (error) {
      console.error("Error updating nalog:", error);
      toast.error("Failed to update nalog");
    }
  };

  const handleExternalStatusUpdate = async (messageId, status) => {
    try {
      const res = await fetch(`/api/messages/${messageId}/external-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status,
          notes: `Status updated to ${status} by ${authUser.fullName}`,
        }),
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      toast.success(`Status updated to ${status}`);
      // The message will be updated via socket event
    } catch (error) {
      console.error("Error updating external status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleCheckbox = async () => {
    if (color) {
      try {
        const res = await fetch(
          `/api/messages/uncheck/${selectedConversation._id}/${message._id}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );

        const data = await res.json();

        if (data.error) {
          throw new Error(data.error);
        }
      } catch (error) {
        toast.error(error.message);
      }

      setColor(false);
    } else {
      try {
        const res = await fetch(
          `/api/messages/${selectedConversation._id}/${message._id}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );

        const data = await res.json();

        if (data.error) {
          throw new Error(data.error);
        }
      } catch (error) {
        toast.error(error.message);
      }

      setColor(true);
    }
  };

  const handlePrint = () => {
    const iframe = iframeRef.current;
    const gigamaxUser = isUUID(message.buyer);

    const isIdNumber =
      message.senderUsername && !isNaN(Number(message.senderUsername));

    // Ensure the gigaId is a string
    const qrCodeContent = String(
      isIdNumber ? message.senderUsername : message.sellerId
    );

    try {
      let gigamaxQrCodeSVG = "";

      if (gigamaxUser) {
        const gigamaxQrCode = new QRCodeSVG(String(message.buyer), {
          width: 50,
          height: 50,
        });
        gigamaxQrCode.options.width = 60;
        gigamaxQrCode.options.height = 60;

        gigamaxQrCodeSVG = gigamaxUser ? gigamaxQrCode.svg() : "";
      }

      // Create the QR Code as a Data URL
      const qrCode = new QRCodeSVG(qrCodeContent, {
        width: 50,
        height: 50,
      });

      qrCode.options.width = 60;
      qrCode.options.height = 60;

      // Get the Data URL of the QR code
      const qrCodeSVG = qrCode.svg();

      // Write content to the iframe
      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <html>
        <head>
          <title>Warehouse Request</title>
          <style>
            @page {
              margin: 10mm;
              size: A4;
            }
            
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 0;
              font-size: 12px;
              line-height: 1.3;
              color: #333;
            }
            
            .header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 15px;
              border: 2px solid #333;
              border-radius: 8px;
              overflow: hidden;
            }
            
            .header-section {
              flex: 1;
              padding: 10px;
              text-align: center;
            }
            
            .header-section:first-child {
              border-right: 1px solid #333;
            }
            
            .header-title {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 8px;
              color: #000;
            }
            
            .qr-code {
              margin-top: 8px;
            }
            
            .qr-code svg {
              width: 60px !important;
              height: 60px !important;
            }
            
            .items-container {
              margin-bottom: 15px;
            }
            
            .items-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 8px;
              margin-bottom: 15px;
            }
            
            .item-card {
              border: 2px solid #333;
              border-radius: 6px;
              padding: 8px;
              background: #f9f9f9;
              page-break-inside: avoid;
            }
            
            .item-header {
              background: #f0f0f0;
              margin: -8px -8px 6px -8px;
              padding: 6px 8px;
              border-radius: 6px 6px 0 0;
              font-weight: bold;
              font-size: 11px;
              color: #000;
              border: 1px solid #ccc;
              border-bottom: 2px solid #333;
            }
            
            .item-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 3px;
              font-size: 10px;
            }
            
            .item-row:last-child {
              margin-bottom: 0;
            }
            
            .item-label {
              font-weight: 600;
              color: #555;
              margin-right: 8px;
            }
            
            .item-value {
              color: #333;
              word-break: break-word;
            }
            
            .status-badges {
              display: flex;
              gap: 4px;
              margin-top: 4px;
            }
            
            .badge {
              padding: 2px 6px;
              border-radius: 3px;
              font-size: 9px;
              font-weight: bold;
              text-transform: uppercase;
            }
            
            .badge-pack-yes { 
              background: #f0f0f0; 
              color: #000; 
              border: 2px solid #333;
            }
            .badge-pack-no { 
              background: #e8e8e8; 
              color: #000; 
              border: 1px solid #666;
            }
            .badge-rez-yes { 
              background: #f5f5f5; 
              color: #000; 
              border: 2px solid #000;
            }
            .badge-rez-no { 
              background: #ddd; 
              color: #000; 
              border: 1px solid #999;
            }
            
            .footer-info {
              border: 2px solid #333;
              border-radius: 6px;
              padding: 10px;
              background: #f8f8f8;
              margin-top: 10px;
            }
            
            .footer-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
              gap: 8px;
            }
            
            .footer-item {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
              border-bottom: 1px solid #ccc;
              font-size: 11px;
            }
            
            .footer-item:last-child {
              border-bottom: none;
            }
            
            .footer-label {
              font-weight: 600;
              color: #555;
            }
            
            .footer-value {
              color: #333;
              font-weight: 500;
            }
            
            .title {
              text-align: center;
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 15px;
              color: #000;
              text-transform: uppercase;
              letter-spacing: 1px;
              border-bottom: 2px solid #333;
              padding-bottom: 8px;
            }
            
            @media print {
              body { -webkit-print-color-adjust: exact; }
              .item-card { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="title">Zahtev za Magacin</div>
          
          <div class="header">
            <div class="header-section">
              <div class="header-title">Zaposleni: ${message.sellerId} -  ${
        message.senderUsername
      }</div>
              <div class="qr-code">${qrCodeSVG}</div>
            </div>
            <div class="header-section">
              <div class="header-title">Kupac: ${
                gigamaxUser ? message.buyerName : message.buyer
              }</div>
              <div class="qr-code">${gigamaxUser ? gigamaxQrCodeSVG : ""}</div>
            </div>
          </div>
          
          <div class="items-container">
            <div class="items-grid">
              ${message.messages
                .map(
                  (mess, index) =>
                    `<div class="item-card">
                      <div class="item-header">Proizvod ${index + 1}</div>
                      <div class="item-row">
                        <span class="item-label">EAN:</span>
                        <span class="item-value">${mess.ean || "N/A"}</span>
                      </div>
                      <div class="item-row">
                        <span class="item-label">Naziv:</span>
                        <span class="item-value">${mess.naziv || "N/A"}</span>
                      </div>
                      <div class="item-row">
                        <span class="item-label">Količina:</span>
                        <span class="item-value">${mess.qty || 1}</span>
                      </div>
                      ${
                        mess.web
                          ? `<div class="item-row">
                        <span class="item-label">Web/Ime:</span>
                        <span class="item-value">${mess.web}</span>
                      </div>`
                          : ""
                      }
                      <div class="status-badges">
                        <span class="badge ${
                          mess.pack ? "badge-pack-yes" : "badge-pack-no"
                        }">
                          Pakuj: ${mess.pack ? "DA" : "NE"}
                        </span>
                        <span class="badge ${
                          mess.rez ? "badge-rez-yes" : "badge-rez-no"
                        }">
                          Rezervacija: ${mess.rez ? "DA" : "NE"}
                        </span>
                      </div>
                    </div>`
                )
                .join("")}
            </div>
          </div>
          
          <div class="footer-info">
            <div class="footer-grid">
              <div class="footer-item">
                <span class="footer-label">Sava Osiguranje:</span>
                <span class="footer-value">${message.sava ? "DA" : "NE"}</span>
              </div>
              ${
                message.savaGodine
                  ? `<div class="footer-item">
                <span class="footer-label">Period:</span>
                <span class="footer-value">${message.savaGodine}</span>
              </div>`
                  : ""
              }
              <div class="footer-item">
                <span class="footer-label">Datum:</span>
                <span class="footer-value">${new Date().toLocaleDateString(
                  "sr-RS"
                )}</span>
              </div>
              <div class="footer-item">
                <span class="footer-label">Vreme:</span>
                <span class="footer-value">${new Date().toLocaleTimeString(
                  "sr-RS",
                  { hour: "2-digit", minute: "2-digit" }
                )}</span>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
      doc.close();
    } catch (error) {
      console.error("Error generating QR Code: ", error);
    }

    // Trigger print
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  };

  return (
    <div className={`chat ${chatClassName} relative`}>
      <div className="chat-image avatar ">
        <div className="w-10 rounded-full ">
          <img id="avatar" src="/avatar.png" alt="icon photo" />
        </div>
      </div>
      <div
        className={`chat-bubble text-white ${bgColor} pb-2 hover:cursor-pointer`}
        onClick={() => {
          if (!fromMe) handlePrint();
        }}
      >
        {/* External Request Header */}
        {message.isExternalRequest && (
          <div className="mb-3 p-2 bg-black/20 rounded border-l-4 border-yellow-400">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-yellow-300 font-semibold text-xs">
                🏭 EXTERNAL REQUEST
              </span>
            </div>
            <div className="text-xs space-y-1">
              <div>
                🏢 From Shop:{" "}
                <span className="font-semibold text-yellow-200">
                  {message.senderShopName ||
                    message.senderId?.shopName ||
                    "Unknown Shop"}
                </span>
              </div>
              <div>
                👤 Sender:{" "}
                <span className="font-semibold">
                  {message.senderId?.fullName || "Unknown"}
                </span>
              </div>
              <div>
                📦 Order:{" "}
                <span className="font-mono">{message.orderNumber}</span>
              </div>
              <div>
                📅 Date: {new Date(message.orderDate).toLocaleDateString()}
              </div>
              <div>
                � Action:{" "}
                <span
                  className={`ml-1 px-2 py-0.5 rounded text-xs font-bold ${
                    message.externalAction === "send"
                      ? "bg-blue-600 text-blue-100"
                      : "bg-purple-600 text-purple-100"
                  }`}
                >
                  {message.externalAction === "send"
                    ? "SEND TO SHOP"
                    : "KEEP FOR PICKUP"}
                </span>
              </div>
              <div>
                �📍 Status:
                <span
                  className={`ml-1 px-2 py-0.5 rounded text-xs font-bold ${
                    message.externalStatus === "pending"
                      ? "bg-yellow-600 text-yellow-100"
                      : message.externalStatus === "sending"
                      ? "bg-blue-600 text-blue-100"
                      : message.externalStatus === "keeping"
                      ? "bg-green-600 text-green-100"
                      : message.externalStatus === "rejected"
                      ? "bg-red-600 text-red-100"
                      : "bg-gray-600 text-gray-100"
                  }`}
                >
                  {message.externalStatus?.toUpperCase() || "PENDING"}
                </span>
              </div>
              {message.lastUpdateDate &&
                message.lastUpdateDate !== message.orderDate && (
                  <div>
                    🔄 Updated:{" "}
                    {new Date(message.lastUpdateDate).toLocaleDateString()}
                  </div>
                )}
            </div>
          </div>
        )}

        {/* External Request Status Update Buttons - Only for warehousemen receiving external requests */}
        {message.isExternalRequest &&
          !fromMe &&
          authUser.role === "warehouseman" && (
            <div className="mb-3 p-2 bg-black/20 rounded">
              <div className="text-xs text-yellow-300 mb-2 font-semibold">
                Update Status:
              </div>
              <div className="flex flex-wrap gap-1">
                {["sending", "keeping", "rejected"].map((status) => (
                  <button
                    key={status}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExternalStatusUpdate(message._id, status);
                    }}
                    className={`px-2 py-1 text-xs rounded font-bold transition-colors ${
                      message.externalStatus === status
                        ? "bg-white text-gray-800"
                        : status === "sending"
                        ? "bg-blue-600 hover:bg-blue-700 text-blue-100"
                        : status === "keeping"
                        ? "bg-green-600 hover:bg-green-700 text-green-100"
                        : "bg-red-600 hover:bg-red-700 text-red-100"
                    }`}
                    disabled={message.externalStatus === status}
                  >
                    {status === "sending"
                      ? "📤 Sending"
                      : status === "keeping"
                      ? "📦 Keeping"
                      : "❌ Rejected"}
                  </button>
                ))}
              </div>
            </div>
          )}

        {/* Nalog Update Section - Only for warehousemen on external requests */}
        {message.isExternalRequest &&
          !fromMe &&
          authUser.role === "warehouseman" && (
            <div className="mb-3 p-2 bg-black/20 rounded">
              <div className="text-xs text-yellow-300 mb-2 font-semibold">
                Update Nalog:
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nalogValue}
                  onChange={(e) => setNalogValue(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Enter nalog..."
                  className="flex-1 px-2 py-1 text-xs rounded bg-white text-gray-800 border-2 border-gray-300 focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNalogUpdate(message._id);
                  }}
                  className="px-3 py-1 text-xs rounded font-bold bg-blue-600 hover:bg-blue-700 text-blue-100 transition-colors"
                >
                  Update
                </button>
              </div>
            </div>
          )}

        {/* Display Nalog for everyone if it exists */}
        {message.isExternalRequest && message.nalog && (
          <div className="mb-2 p-2 bg-green-900/30 rounded border-l-4 border-green-400">
            <div className="text-xs">
              <span className="font-semibold text-green-300">📋 Nalog:</span>{" "}
              <span className="text-white">{message.nalog}</span>
            </div>
          </div>
        )}

        {message.messages && message.messages.length > 0 ? (
          message.messages.map((mess, index) => (
            <div key={`${message._id}-${mess.ean}-${mess.naziv}-${index}`}>
              EAN: {mess.ean} <br />
              {mess.naziv}
            </div>
          ))
        ) : (
          <div>No items in this message</div>
        )}
      </div>
      {!fromMe ? (
        <input
          type="checkbox"
          name="opened"
          id="opened"
          className="checkbox hover:cursor-pointer top-2/4 right-1 -translate-y-1/2 absolute"
          onChange={handleCheckbox}
          checked={color}
        />
      ) : null}
      <div className="chat-footer opacity-50 text-xs text-base-content flex gap-1 items-center">
        {formatedTime}
      </div>
      <iframe
        ref={iframeRef}
        style={{ display: "none" }}
        title="Print Message Frame"
      />
    </div>
  );
};

export default Message;

Message.propTypes = {
  message: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    senderId: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        fullName: PropTypes.string,
        shopId: PropTypes.string,
      }),
    ]).isRequired,
    opened: PropTypes.bool,
    createdAt: PropTypes.string.isRequired,
    gigaId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    sellerId: PropTypes.string,
    senderUsername: PropTypes.string,
    messages: PropTypes.arrayOf(
      PropTypes.shape({
        ean: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        naziv: PropTypes.string,
        qty: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        pack: PropTypes.bool,
        web: PropTypes.string,
        rez: PropTypes.bool,
      })
    ),
    sava: PropTypes.bool,
    savaGodine: PropTypes.string,
    buyer: PropTypes.string,
    buyerName: PropTypes.string,
    // External request fields
    isExternalRequest: PropTypes.bool,
    orderNumber: PropTypes.string,
    orderDate: PropTypes.string,
    externalStatus: PropTypes.string,
    externalAction: PropTypes.string,
    lastUpdateDate: PropTypes.string,
    senderShopName: PropTypes.string,
    nalog: PropTypes.string,
  }).isRequired,
};

function extractTime(dateString) {
  const date = new Date(dateString);
  const hours = padZero(date.getHours());
  const minutes = padZero(date.getMinutes());
  return `${hours}:${minutes}`;
}
function padZero(number) {
  return number.toString().padStart(2, "0");
}
