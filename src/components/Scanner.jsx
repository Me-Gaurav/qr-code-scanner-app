import React, { useEffect, useRef, useState } from "react";
import {
  Html5Qrcode,
  Html5QrcodeScannerState,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";

const QrScanner = () => {
  const scannerRef = useRef(null);
  const [scannedResult, setScannedResult] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [scanError, setScanError] = useState("");
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [isCameraRunning, setIsCameraRunning] = useState(false);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const qrRegionId = "qr-reader";

  const startScanning = async () => {
    try {
      setIsLoadingCamera(true);
      setScanError("");

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(qrRegionId);
      }

      if (scannerRef.current.getState() === Html5QrcodeScannerState.NOT_STARTED) {
        const devices = await Html5Qrcode.getCameras();
        if (devices.length > 0) {
          await scannerRef.current.start(
            { facingMode: { exact: "environment" } },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              formatsToSupport: [
                Html5QrcodeSupportedFormats.QR_CODE,
                Html5QrcodeSupportedFormats.DATA_MATRIX,
              ],
              aspectRatio: 1.0,
              disableFlip: false,
            },
            async (decodedText) => {
              setSuccessMessage("✅ QR code detected successfully");
              setScannedResult(decodedText);
              const deviceId = decodedText.split(",")[0];
              await stopScanning();
              fetchDeviceData(deviceId);
            },
            (err) => {
              console.warn("Scan error:", err);
              setScanError("Scan error occurred.");
            }
          );
          setIsCameraRunning(true);
        } else {
          setScanError("No camera found.");
        }
      }
    } catch (error) {
      console.error("Error starting scanner:", error);
      setScanError("Unable to access camera.");
    } finally {
      setIsLoadingCamera(false);
    }
  };

  const stopScanning = async () => {
    try {
      if (
        scannerRef.current &&
        scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING
      ) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        setIsCameraRunning(false);
      }
    } catch (error) {
      console.warn("Error stopping scanner:", error);
    }
  };

  const fetchDeviceData = async (deviceId) => {
    const token = sessionStorage.getItem("qrToken");
    try {
      const res = await fetch("https://sml-qr-scanning-psi.vercel.app/api/get-device-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, token }),
      });
      const data = await res.json();
      setDeviceInfo(data[0] || null);
    } catch (err) {
      console.error("Fetch error:", err);
      setDeviceInfo(null);
    }
  };

  useEffect(() => {
    scannerRef.current = new Html5Qrcode(qrRegionId);
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="scanner-container">
      <h2 className="title">QR / Data Matrix Scanner</h2>
      {scanError && <p style={{ color: "red" }}>{scanError}</p>}
      <div id={qrRegionId} className="qr-video" />

      <div className="scanner-controls">
        {!isCameraRunning && !scannedResult && (
          <button
            onClick={startScanning}
            style={buttonStyle}
            disabled={isLoadingCamera}
          >
            {isLoadingCamera ? "Loading camera..." : "Start Scanning"}
          </button>
        )}
        {isCameraRunning && (
          <button onClick={stopScanning} style={buttonStyle}>
            Stop Scanning
          </button>
        )}
        {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}

        {scannedResult && (
          <>
            <button
              onClick={() => {
                setScannedResult(null);
                setSuccessMessage("");
                setDeviceInfo(null);
                startScanning();
              }}
              style={buttonStyle}
            >
              Scan Another
            </button>
          </>
        )}
      </div>

      {deviceInfo && (
        <div className="device-info">
          <h3>Device Information</h3>
          <p><strong>Device ID:</strong> {deviceInfo.Name}</p>
          <p><strong>Action Needed:</strong> {deviceInfo.Action_Needed__c}</p>
          <p><strong>Battery Voltage:</strong> {deviceInfo.Battery_Voltage__c}</p>
          <p><strong>Estimated Battery:</strong> {deviceInfo.est_Batterycalculate__c}</p>
          <p><strong>Last Connected:</strong> {new Date(deviceInfo.Last_Connected__c).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
};

// Styles
const buttonStyle = {
  padding: "10px 20px",
  fontSize: "16px",
  margin: "8px",
  cursor: "pointer",
  width: "90%",
  maxWidth: "400px",
  display: "block",
  marginLeft: "auto",
  marginRight: "auto",
};

const style = document.createElement("style");
style.innerHTML = `
  .scanner-container {
    text-align: center;
    padding: 1rem;
    max-width: 100%;
  }

  .title {
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  .qr-video {
    width: 100%;
    max-width: 500px;
    aspect-ratio: 1;
    margin: 0 auto;
    border-radius: 8px;
    overflow: hidden;
    border: 2px solid #ccc;
  }

  .scanner-controls {
    margin-top: 1rem;
  }

  .device-info {
    margin-top: 1rem;
    text-align: left;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
    padding: 1rem;
    background: #f3f3f3;
    border-radius: 8px;
  }

  @media (max-width: 600px) {
    .title {
      font-size: 1.25rem;
    }

    .qr-video {
      width: 90%;
    }
  }
`;
document.head.appendChild(style);

export default QrScanner;
