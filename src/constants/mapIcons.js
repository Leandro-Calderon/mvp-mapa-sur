import L from "leaflet";
import markerIcon from "/assets/marker-icon.png";
import markerShadow from "/assets/marker-shadow.png";
import gpsIcon from "/assets/gps.png";

// Icono para puntos de interés (del GeoJSON)
export const customIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Icono para tu ubicación en tiempo real
export const locationIcon = L.icon({
  iconUrl: gpsIcon,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});