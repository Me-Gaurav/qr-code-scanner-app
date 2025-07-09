import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";

const QrScanner = () => {
  const scannerRef = useRef(null);
  const [scannedResult, setScannedResult] = useState(null);
  const [isCameraRunning, setIsCameraRunning] = useState(false);
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const qrRegionId = "qr-reader";

  const startScanning = async () => {
    try {
      setIsLoadingCamera(true);

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(qrRegionId);
      }

      if (scannerRef.current.getState() === Html5QrcodeScannerState.NOT_STARTED) {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          await scannerRef.current.start(
            { facingMode: "environment" },
            {
              fps: 15, // higher fps = faster scan
              qrbox: (viewportWidth, viewportHeight) => {
                const minEdge = Math.min(viewportWidth, viewportHeight);
                return { width: minEdge * 0.8, height: minEdge * 0.8 };
              },
              disableFlip: false,
              aspectRatio: 1.0,
            },
            (decodedText) => {
              setScannedResult(decodedText);
              stopScanning();
            },
            () => {} // optional error callback
          );
          setIsCameraRunning(true);
        } else {
          alert("No camera found.");
        }
      }
    } catch (error) {
      console.error("Error starting scanner:", error);
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

  useEffect(() => {
    scannerRef.current = new Html5Qrcode(qrRegionId);
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="scanner-container">
      <h2 className="title">QR Code Scanner</h2>
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
        {scannedResult && (
          <>
            <p style={{ color: "green" }}>✅ Scanned: {scannedResult}</p>
            <button
              onClick={() => {
                setScannedResult(null);
                startScanning();
              }}
              style={buttonStyle}
            >
              Scan Another QR
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// 👇 Mobile responsive styles
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
