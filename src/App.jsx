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
  const [data, setData] = useState({})

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

    navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
      stream.getTracks().forEach(track => track.stop()); // close preview
    })

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          // Get all back-facing cameras
          const backCameras = devices.filter((d) => d.label.toLowerCase().includes("back"));

          // Prefer wide or main camera (exclude ultra-wide if possible)
          const preferredCamera = backCameras.find((d) =>
            !d.label.toLowerCase().includes("ultra")
          ) || backCameras[0]; // fallback if none found

          const cameraConfig = preferredCamera
            ? { deviceId: { exact: preferredCamera.id } }
            : { facingMode: "environment" };

          setData({
            backCameras: backCameras,
            preferredCamera: preferredCamera,
            cameraConfig: cameraConfig
          })
          // const backCam = devices.find((d) => d.label.toLowerCase().includes("back"));

          // const cameraConfig = backCam
          //   ? { deviceId: { exact: backCam.id } }
          //   : { facingMode: "environment" };
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
      <h2>Latest QR Scanner - 2</h2>
      {scanError && <p className="no-data">{scanError}</p>}

      <div id="qr-reader" style={{ width: "100%" }} ref={qrRef} />

      <button onClick={isScanning ? stopScan : startScan} className="scan-btn">
        {isScanning ? "Stop Scan" : "Start Scan"}
      </button>

      <p style={{width: 100}}>
        {JSON.stringify(data)}
      </p>

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
