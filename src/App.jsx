import { useEffect, useRef, useState } from "react";
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";
import "./App.css";

export default function App() {
  const qrRef = useRef(null);
  const scannerRef = useRef(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [scanError, setScanError] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    scannerRef.current = new Html5Qrcode("qr-reader");

    return () => {
      if (scannerRef.current) {
        if (isScanning) {
          scannerRef.current
            .stop()
            .catch(() => { })
            .finally(() => scannerRef.current.clear());
        } else {
          scannerRef.current.clear();
        }
      }
    };
  }, []);

  useEffect(() => {
    if (deviceInfo) {
      stopScan();
    }
  }, [deviceInfo])

  const stopScan = () => {
    if (scannerRef.current && isScanning) {
      return scannerRef.current
        .stop()
        .then(() => {
          scannerRef.current.clear();
          setIsScanning(false);
        })
        .catch((e) => {
          console.warn("Stop error:", e);
          setIsScanning(false);
        });
    } else {
      return Promise.resolve();
    }
  };

  const startScan = () => {
    setDeviceInfo(null)

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          const backCam = devices.find((d) =>
            d.label.toLowerCase().includes("back")
          );
          const cameraConfig = backCam
            ? { deviceId: { exact: backCam.id } }
            : { facingMode: "environment" };
          scannerRef.current
            .start(
              cameraConfig,
              {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                formatsToSupport: [
                  Html5QrcodeSupportedFormats.QR_CODE,
                  Html5QrcodeSupportedFormats.DATA_MATRIX,
                ],
              },
              (decodedText) => {
                setSuccessMessage("QR code detected successfully");
                setDeviceInfo(decodedText);
              },
            )
            .then(() => {
              setIsScanning(true);
              setScanError("");
            })
            .catch(() => {
              setScanError("Unable to access camera.");
              setIsScanning(false);
            });
        }
      })
      .catch(() => {
        setScanError("No camera found or permission denied.");
      });
  };

  return (
    <div className="container">
      <h2>Latest QR Scanner</h2>
      {scanError && <p className="no-data">{scanError}</p>}

      <div id="qr-reader" style={{ width: "100%" }} ref={qrRef} />

      <button onClick={isScanning ? stopScan : startScan} className="scan-btn">
        {isScanning ? "Stop Scan" : "Start Scan"}
      </button>

      {deviceInfo && (
        <div className="device-info">
          {successMessage && <p className="success">{successMessage}</p>}
          <h4>Device Information</h4>
          <p>{deviceInfo}</p>
        </div>
      )}
    </div>
  );
}
