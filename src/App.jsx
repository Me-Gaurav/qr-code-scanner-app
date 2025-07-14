import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import "./App.css";

export default function App() {
  const [successMessage, setSuccessMessage] = useState("");
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [lastConnected, setLastConnected] = useState(null);
  const [scanError, setScanError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");

  const qrRef = useRef(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    scannerRef.current = new Html5Qrcode("qr-reader");

    const qrToken = sessionStorage.getItem("qrToken");
    const tokenExpiry = parseInt(sessionStorage.getItem("tokenExpiry"), 10);
    const currentTime = Date.now();

    if (!qrToken || isNaN(tokenExpiry) || currentTime > tokenExpiry) {
      console.info("Fetching new token from server...");
      getAccessToken();
    } else {
      console.info("Using valid cached token");
    }

    return () => {
      if (scannerRef.current) {
        if (isScanning) {
          scannerRef.current
            .stop()
            .catch(() => {})
            .finally(() => scannerRef.current.clear());
        } else {
          scannerRef.current.clear();
        }
      }
    };
  }, []);

  function getAccessToken() {
    const url = "https://sml-qr-scanning-psi.vercel.app/get-token"; // Proxy server URL for getting token

    // Send a POST request to get the access token
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.access_token) {
          // Save token and expiry time in localStorage
          const tokenExpiry = new Date().getTime() + 3600 * 1000;
          sessionStorage.setItem("qrToken", data.access_token);
          sessionStorage.setItem("tokenExpiry", tokenExpiry);
        } else {
          alert("Failed to authenticate.");
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        alert("An error occurred while trying to authenticate.");
      });
  }

  useEffect(() => {
    if (deviceInfo) {
      stopScan();
    }
  }, [deviceInfo]);

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

  function fetchDataFromApex(deviceId) {
    const endpoint = `https://smartlogisticsinc--fullcopy.sandbox.my.salesforce-sites.com/services/apexrest/qrScanner/?deviceId=${deviceId}`;
    const qrToken = sessionStorage.getItem("qrToken");

    fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: "Bearer " + qrToken, // Include the token in the request header
      },
    })
      .then((response) => response.json())
      .then((data) => {
        const utcDate = new Date(data[0].Last_Connected__c);

        // Convert UTC time to CST/CDT (Central Time)
        const options = {
          timeZone: "America/Chicago",
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        };
        const formattedDate = new Intl.DateTimeFormat("en-US", options).format(
          utcDate
        );
        setLastConnected(formattedDate);

        setDeviceInfo(data); // Display the data retrieved from Apex
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  const startScan = () => {
    setDeviceInfo(null);

    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      stream.getTracks().forEach((track) => track.stop()); // close preview
    });

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setAvailableCameras(devices);

          // const selectedCamera = devices.find((d) => d.id === selectedCameraId);

          // const backCameras = devices.filter((d) => d.label.toLowerCase().includes("back"));

          // const preferredCamera = selectedCamera || backCameras.find((d) =>
          //   !d.label.toLowerCase().includes("ultra")
          // ) || backCameras[0];

          // const cameraConfig = preferredCamera
          //   ? { deviceId: { exact: preferredCamera.id } }
          //   : { facingMode: "environment" };

          // const scanOptions = {
          //   fps: 10,
          //   qrbox: { width: 250, height: 250 },
          //   formatsToSupport: [
          //     Html5QrcodeSupportedFormats.QR_CODE,
          //     Html5QrcodeSupportedFormats.DATA_MATRIX,
          //   ],
          // };

          const ultraWideCam = devices.find((d) =>
            d.label.toLowerCase().includes("ultra")
          );

          const backCameras = devices.filter((d) =>
            d.label.toLowerCase().includes("back")
          );

          const fallbackCamera = backCameras[0] || devices[0];

          // Auto-select logic (only if user hasn't manually selected)
          if (!selectedCameraId) {
            if (ultraWideCam) {
              setSelectedCameraId(ultraWideCam.id);
            } else if (fallbackCamera) {
              setSelectedCameraId(fallbackCamera.id);
            }
          }

          // Re-select selected camera from updated list
          const selectedCamera = devices.find(
            (d) =>
              d.id ===
              (ultraWideCam?.id || fallbackCamera?.id || selectedCameraId)
          );

          const cameraConfig = selectedCamera
            ? { deviceId: { exact: selectedCamera.id } }
            : { facingMode: "environment" };

          const scanOptions = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            formatsToSupport: [
              Html5QrcodeSupportedFormats.QR_CODE,
              Html5QrcodeSupportedFormats.DATA_MATRIX,
            ],
          };

          scannerRef.current
            .start(cameraConfig, scanOptions, (decodedText) => {
              setSuccessMessage("QR code detected successfully");
              const deviceId = decodedText.split(",")[0]; // Extract the deviceId from the QR code text
              fetchDataFromApex(deviceId);
            })
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
      <h2>SML QR Scanner</h2>
      {scanError && <p className="no-data">{scanError}</p>}

      <div id="qr-reader" style={{ width: "100%" }} ref={qrRef} />

      {availableCameras.length > 0 && (
        <select
          value={selectedCameraId}
          onChange={(e) => setSelectedCameraId(e.target.value)}
          className="camera-dropdown"
        >
          <option value="">Auto-select (Recommended)</option>
          {availableCameras.map((cam) => (
            <option key={cam.id} value={cam.id}>
              {cam.label}
            </option>
          ))}
        </select>
      )}

      <button onClick={isScanning ? stopScan : startScan} className="scan-btn">
        {isScanning ? "Stop Scan" : "Start Scan"}
      </button>

      {deviceInfo && (
        <div className="device-info">
          {successMessage && <p className="success">{successMessage}</p>}
          <h4>Device Information</h4>
          <p>
            <strong>Device ID:</strong> {deviceInfo[0].Name}
          </p>
          <p>
            <strong>Action Needed:</strong> {deviceInfo[0].Action_Needed__c}
          </p>
          <p>
            <strong>Battery Voltage:</strong> {deviceInfo[0].Battery_Voltage__c}
          </p>
          <p>
            <strong>Estimated Battery:</strong>{" "}
            {deviceInfo[0].est_Batterycalculate__c}
          </p>
          <p>
            <strong>Last Connected (CST/CDT):</strong> {lastConnected}
          </p>
        </div>
      )}
    </div>
  );
}
