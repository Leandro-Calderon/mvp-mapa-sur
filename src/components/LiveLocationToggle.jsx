// LiveLocationToggle.jsx
import { useMap } from "react-leaflet";
import { useGeolocation } from "../hooks/useGeolocation";
import { LocationMarker } from "./LocationMarker";
import { ToggleButton } from "./ToggleButton";
import { useEffect } from "react";

export const LiveLocationToggle = () => {
  const { position, error, isActive, startTracking, stopTracking } =
    useGeolocation();

  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  const handleToggle = () => {
    if (isActive) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  if (error) {
    console.error("Geolocation error:", error);
  }

  return (
    <>
      <ToggleButton isActive={isActive} onClick={handleToggle} />
      <LocationMarker position={position} />
    </>
  );

};
export default LiveLocationToggle