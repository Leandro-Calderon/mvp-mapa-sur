import L from "leaflet";
import icono from "../assets/marker-icon.png";
import shadow from "../assets/marker-shadow.png";

export const customIcon = L.icon({
  iconUrl: icono,
  shadowUrl: shadow,
});

export const locationIcon = new L.Icon.Default({
  imagePath: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/"
});
