import { useRef, useState } from "react";
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

    // Ensure the gigaId is a string
    const qrCodeContent = String(message.gigaId);

    try {
      let gigamaxQrCodeSVG = "";

      if (gigamaxUser) {
        const gigamaxQrCode = new QRCodeSVG(String(message.buyer), {
          width: 50,
          height: 50,
        });
        gigamaxQrCode.options.width = 100;
        gigamaxQrCode.options.height = 100;

        gigamaxQrCodeSVG = gigamaxUser ? gigamaxQrCode.svg() : "";
      }

      // Create the QR Code as a Data URL
      const qrCode = new QRCodeSVG(qrCodeContent, {
        width: 50,
        height: 50,
      });

      qrCode.options.width = 100;
      qrCode.options.height = 100;

      // Get the Data URL of the QR code
      const qrCodeSVG = qrCode.svg();

      // Write content to the iframe
      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <html>
        <head>
          <title></title>
          <style>
            body {
              font-family: Arial, sans-serif;
              
            }
            h2 {
              margin: 2rem;
              text-align:center;
              color: #333;
            }

            .qr-code{
            width:100%;
            display:flex;
            justify-content:center;
            }
  
            p, span {
              font-size: 24px;
              margin: 10px 0;
            }
            
            .group{
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid black;
            }
  
            .group:last-of-type{
            border-bottom: unset;
            }

            .seller{
            width: 50%;
            padding: 0.5rem;
            border: 1px solid black;
            }

            .sellerBuyer{
            display: flex;
            justify-content: space-between;
            alighn-items: center;
            }
          </style>
        </head>
        <body>
        <div class="sellerBuyer">
        <div class="seller">
        <h2><strong>Prodavac:</strong> ${message.sellerId}  -  ${
        message.gigaId
      }</h2>
         <div class="qr-code">${qrCodeSVG}</div>
          </div>
       <div class="seller" style="border-left: none;">
       <h2><strong>Kupac:</strong> ${
         gigamaxUser ? "GIGAMAX Member" : message.buyer
       }</h2>
       <div class="qr-code">${gigamaxUser ? gigamaxQrCodeSVG : ""}</div>
       </div>
       </div>
          ${message.messages.map(
            (mess) =>
              `<div class="group"><p><strong>EAN:</strong></p><span>${mess.ean}</span></div>
           <div class="group"><p><strong>Naziv proizvoda:</strong></p><span>${mess.naziv}</span></div>
           <div class="group"><p><strong>Kolicina:</strong></p>
            <span>${mess.qty}</span></div>
           `
          )}
          
          <div class="group">
          <p><strong>Sava:</strong></p>
          <span>${message.sava ? "Da" : "Ne"}</span>
          </div>
          <div class="group">
          <p><strong>Dodatne:</strong></p>
          <span>${message.savaGodine}</span>
          </div>
          <div class="group">
          <p><strong>Treba zapakovati uredjaj:</strong></p>
          <span>${message.toPack ? "Da" : "Ne"}</span>
          </div>
          <div class="group">
          <p><strong>Uredjaj je na rezervaciji:</strong></p>
          <span>${message.rez ? "Da" : "Ne"}</span>
          </div>
          <div class="group">
          <p><strong>WEB ili Ime kupca:</strong></p>
          <span>${message.web || " "}</span>
          </div>
          <div class="group">
          <p><strong>Kupac:</strong></p>
          <span>${message.buyer}</span>
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
          <img id="avatar" src="/avataaars.png" alt="icon photo" />
        </div>
      </div>
      <div
        className={`chat-bubble text-white ${bgColor} pb-2 hover:cursor-pointer`}
        onClick={() => {
          if (!fromMe) handlePrint();
        }}
      >
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
    messages: PropTypes.arrayOf(
      PropTypes.shape({
        ean: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        naziv: PropTypes.string,
        qty: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      })
    ),
    sava: PropTypes.bool,
    savaGodine: PropTypes.string,
    toPack: PropTypes.bool,
    rez: PropTypes.bool,
    web: PropTypes.string,
    buyer: PropTypes.string,
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
