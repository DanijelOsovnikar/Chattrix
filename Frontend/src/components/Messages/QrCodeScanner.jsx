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
    qrCodeKupac,
    setQrCodeKupac,
    setScannerResultKupac,
  } = useConversations();

  const scan = (result) => {
    if (qrCodeKupac) {
      setScannerResultKupac(result[0].rawValue);
      setQrCodeKupac(false);
    }

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
      <Scanner
        onScan={scan}
        formats={[
          "qr_code",
          "ean_13",
          "ean_8",
          "code_128",
          "code_39",
          "code_93",
          "codabar",
          "itf",
          "upc_a",
          "upc_e",
          "data_matrix",
          "pdf417",
          "aztec",
        ]}
      />
    </div>
  );
};

export default QrCodeScanner;
