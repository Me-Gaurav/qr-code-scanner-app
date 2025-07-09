// import { useEffect, useRef, useState } from "react";
// import {
//   Html5Qrcode,
//   Html5QrcodeSupportedFormats,
// } from "html5-qrcode";
import "./App.css";
import QrScanner from "./components/Scanner";

export default function App() {
  // const qrRef = useRef(null);
  // const scannerRef = useRef(null);
  // const [successMessage, setSuccessMessage] = useState("");
  // const [deviceInfo, setDeviceInfo] = useState(null);
  // const [scanError, setScanError] = useState("");

  // useEffect(() => {
  //   const html5QrCode = new Html5Qrcode("qr-reader");
  //   scannerRef.current = html5QrCode;
  
  //   Html5Qrcode.getCameras()
  //     .then((devices) => {
  //       if (devices && devices.length) {
  //         // const cameraId = devices[0].id;
  //         const cameraConfig = { facingMode: { exact: "environment" } };
  
  //         html5QrCode
  //           .start(
  //             cameraConfig,
  //             {
  //               fps: 10,
  //               qrbox: { width: 250, height: 250 },
  //               formatsToSupport: [
  //                 Html5QrcodeSupportedFormats.QR_CODE,
  //                 Html5QrcodeSupportedFormats.DATA_MATRIX,
  //               ],
  //             },
  //             (decodedText) => {
  //               setSuccessMessage("QR code detected successfully");
  //               const deviceId = decodedText.split(",")[0];
  //               html5QrCode.stop().then(() => {
  //                 fetchDeviceData(deviceId);
  //               });
  //             },
  //             (err) => {
  //               console.warn("Scan error:", err);
  //             }
  //           )
  //           .catch((err) => {
  //             console.error("Camera start failed:", err);
  //             setScanError("Unable to access camera.");
  //           });
  //       }
  //     })
  //     .catch((err) => {
  //       console.error("Camera error:", err);
  //       setScanError("No camera found or permission denied.");
  //     });
  
  //   return () => {
  //     const scanner = scannerRef.current;
  //     if (scanner) {
  //       try {
  //         const stopPromise = scanner.stop();
  //         if (stopPromise && typeof stopPromise.then === "function") {
  //           stopPromise
  //             .then(() => scanner.clear && scanner.clear())
  //             .catch((e) => console.warn("Stop error:", e));
  //         } else {
  //           scanner.clear && scanner.clear();
  //         }
  //       } catch (e) {
  //         console.warn("Cleanup error:", e);
  //       }
  //     }
  //   };
  // }, []);

  // function fetchDeviceData(deviceId) {
  //   const token = sessionStorage.getItem("qrToken");

  //   fetch("https://sml-qr-scanning-psi.vercel.app/api/get-device-data", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ deviceId, token }),
  //   })
  //     .then((res) => res.json())
  //     .then((data) => setDeviceInfo(data[0] || null))
  //     .catch((err) => {
  //       console.error("Fetch error:", err);
  //       setDeviceInfo(null);
  //     });
  // }

  return (
    <QrScanner />
    // <div className="container">
    //   <h2>Data Matrix + QR Scanner</h2>
    //   {scanError && <p className="no-data">{scanError}</p>}

    //   <div id="qr-reader" style={{ width: "100%" }} ref={qrRef} />

    //   {successMessage && <p className="success">{successMessage}</p>}

    //   {deviceInfo && (
    //     <div className="device-info">
    //       <h3>Device Information</h3>
    //       <p><strong>Device ID:</strong> {deviceInfo.Name}</p>
    //       <p><strong>Action Needed:</strong> {deviceInfo.Action_Needed__c}</p>
    //       <p><strong>Battery Voltage:</strong> {deviceInfo.Battery_Voltage__c}</p>
    //       <p><strong>Estimated Battery:</strong> {deviceInfo.est_Batterycalculate__c}</p>
    //       <p><strong>Last Connected:</strong> {new Date(deviceInfo.Last_Connected__c).toLocaleString()}</p>
    //     </div>
    //   )}
    // </div>
  );
}
