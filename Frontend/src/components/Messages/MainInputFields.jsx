import React, { useEffect, useState } from "react";
import { BsQrCodeScan } from "react-icons/bs";
import useConversations from "../../store/useConversation";

const MainInputFields = ({ index, ean, naziv, updateMessage, qty }) => {
  const [scanQr, setScanQr] = useState("");
  const [scanName, setScanName] = useState("");
  const {
    setQrCode,
    setQrCodeName,
    activeScannerIndex,
    setActiveScannerIndex,
    scannerResult,
    scannerResultName,
  } = useConversations();

  useEffect(() => {
    if (activeScannerIndex === index) {
      if (scannerResult && scannerResult !== scanQr) {
        setScanQr(scannerResult);
        updateMessage(index, "ean", scannerResult);
      }
      if (scannerResultName && scannerResultName !== scanName) {
        setScanName(scannerResultName);
        updateMessage(index, "naziv", scannerResultName);
      }
    }
  }, [scannerResult, scannerResultName, activeScannerIndex]);

  const handleQrCodeClick = () => {
    setQrCode(true);
    setActiveScannerIndex(index);
  };

  const handleNameCodeClick = () => {
    setQrCodeName(true);
    setActiveScannerIndex(index);
  };
  return (
    <>
      <div className="groupInputQr">
        <input
          type="text"
          placeholder="EAN"
          id="ean"
          value={ean}
          onChange={(e) => updateMessage(index, "ean", Number(e.target.value))}
          className="border my-2 text-sm rounded-lg block w-full p-2.5 bg-gray-600 text-white"
        />
        <button type="button" className="qrCodeBtn" onClick={handleQrCodeClick}>
          <BsQrCodeScan />
        </button>
      </div>
      <div className="groupInputQr">
        <input
          type="text"
          placeholder="NAZIV PROIZVODA"
          id="naziv"
          value={naziv}
          onChange={(e) => updateMessage(index, "naziv", e.target.value)}
          className="border my-2 text-sm rounded-lg block w-full p-2.5 bg-gray-600 text-white"
        />
        <button
          type="button"
          className="qrCodeBtn"
          onClick={handleNameCodeClick}
        >
          <BsQrCodeScan />
        </button>
      </div>
      <select
        name="qty"
        id="qty"
        value={qty}
        onChange={(e) => updateMessage(index, "qty", Number(e.target.value))}
        className="border min-h-9 my-2 text-sm rounded-lg block w-full p-2.5 bg-gray-600 text-white"
      >
        {Array.from({ length: 10 }, (_, i) => (
          <option key={i + 1} value={i + 1}>
            {i + 1}
          </option>
        ))}
      </select>
    </>
  );
};

export default MainInputFields;
