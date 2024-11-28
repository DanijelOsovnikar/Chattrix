import React, { useEffect } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import useConversations from "../../store/useConversation";

const QrCodeScanner = () => {
  const {
    setQrCode,
    setScannerResult,
    setQrCodeName,
    setScannerResultName,
    qrCode,
    qrCodeName,
  } = useConversations();

  const scan = (result) => {
    if (qrCode) {
      setScannerResult(result[0].rawValue);
      setQrCode(false);
    }

    if (qrCodeName) {
      const url = result[0].rawValue;

      // Create a URL object
      const urlObj = new URL(url);

      // Get the pathname (everything after the domain)
      const pathname = urlObj.pathname;

      // Split the pathname by `/` and get the last part
      const lastPart = pathname.split("/").pop();

      // Remove the numeric suffix after the last hyphen
      const extractedPart = lastPart.replace(/-\d+$/, "");

      const output = extractedPart.replace(/-/g, " ");

      setScannerResultName(output);
      setQrCodeName(false);
    }
  };

  return (
    <div className="scannerD">
      <Scanner onScan={scan} />
    </div>
  );
};

export default QrCodeScanner;
