import L from "leaflet";
import icono from "../assets/marker-icon.png";
import shadow from "../assets/marker-shadow.png";

export const customIcon = L.icon({
  iconUrl: icono,
  shadowUrl: shadow,
});

export const locationIcon = L.icon({
  iconUrl: 'path/to/location-icon.png', // Add your location icon
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});
