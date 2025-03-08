import { Circle } from "react-leaflet";

export const AccuracyCircle = ({ center, radius }) => (
  <Circle
    center={center}
    radius={radius}
    pathOptions={{
      fillColor: "#3388ff",
      fillOpacity: 0.15,
      color: "#3388ff",
      weight: 1,
    }}
  />
);
