import { Marker, Popup } from "react-leaflet";
import { locationIcon } from "../constants/mapIcons";
import type { LatLngArray } from "../types/map";

interface LocationMarkerProps {
  position: LatLngArray;
}

export const LocationMarker = ({ position }: LocationMarkerProps) => {
  if (!position) return null;

  return (
    <Marker position={position} icon={locationIcon}>
      <Popup>
        Your current location
        <br />
        Lat: {position[0].toFixed(6)}
        <br />
        Lng: {position[1].toFixed(6)}
      </Popup>
    </Marker>
  );
};
