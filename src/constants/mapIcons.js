import L from "leaflet";
import markerIcon from "/assets/marker-icon.png";
import markerShadow from "/assets/marker-shadow.png";

// Icono para puntos de interés (del GeoJSON)
export const customIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Icono CSS para ubicación en tiempo real
export const locationIcon = L.divIcon({
  className: "custom-location-icon",
  html: `
    <div style="
      position: relative;
      width: 32px;
      height: 32px;
    ">
      <!-- Pulse effect (outer circle) -->
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 32px;
        height: 32px;
        background: rgba(66, 133, 244, 0.2);
        border-radius: 50%;
        animation: locationPulse 2s ease-out infinite;
      "></div>
      <!-- Main location dot -->
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 16px;
        height: 16px;
        background: #4285F4;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
        z-index: 1;
      "></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});