import L from "leaflet";
import icono from "../assets/marker-icon.png";
import shadow from "../assets/marker-shadow.png";

export const customIcon = L.icon({
  iconUrl: icono,
  shadowUrl: shadow,
});

export const locationIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
