import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// PWA and Notification API debugging
console.log('PWA DEBUG: App starting up');
console.log('PWA DEBUG: Service Worker supported:', 'serviceWorker' in navigator);
console.log('PWA DEBUG: Notification API supported:', 'Notification' in window);
console.log('PWA DEBUG: Current notification permission:', 'Notification' in window ? Notification.permission : 'N/A');
console.log('PWA DEBUG: PWA standalone mode:', window.matchMedia('(display-mode: standalone)').matches);

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
