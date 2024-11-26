import React, { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
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

  useEffect(() => {
    if (qrCode) {
      const scanner = new Html5QrcodeScanner("reader", {
        qrbox: {
          width: 250,
          height: 250,
        },
        fps: 2,
      });

      scanner.render(success, error);

      function success(result) {
        scanner.clear();
        setScannerResult(result);
        setQrCode(false);
      }
    }

    if (qrCodeName) {
      const scannerName = new Html5QrcodeScanner("reader", {
        qrbox: {
          width: 250,
          height: 250,
        },
        fps: 2,
      });

      scannerName.render(successName, error);

      function successName(result) {
        scannerName.clear();
        const url = result;

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
    }

    function error(err) {
      console.log(err);
    }
  }, []);

  return <div id="reader"></div>;
};

export default QrCodeScanner;
