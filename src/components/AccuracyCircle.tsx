import { Circle } from "react-leaflet";
import type { LatLngArray } from "../types/map";

interface AccuracyCircleProps {
  center: LatLngArray;
  radius: number;
}

export const AccuracyCircle = ({ center, radius }: AccuracyCircleProps) => (
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
