// LiveLocationToggle.jsx
import { useMap } from "react-leaflet";
import { useGeolocation } from "../hooks/useGeolocation";
import { LocationMarker } from "./LocationMarker";
import { ToggleButton } from "./ToggleButton";
import { AccuracyCircle } from "./AccuracyCircle";
import { useEffect } from "react";

export const LiveLocationToggle = () => {
  const { position, accuracy, error, isActive, startTracking, stopTracking } =
    useGeolocation();

  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position,18);
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
    
    return (
      <div style={{ 
        position: 'absolute', 
        bottom: '60px', 
        right: '10px', 
        backgroundColor: 'white', 
        padding: '10px', 
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        zIndex: 1000 
      }}>
        Location error: {error}
      </div>
    );
  }

  return (
    <>
      <ToggleButton isActive={isActive} onClick={handleToggle} />
      {position && (
        <>
          <LocationMarker position={position} />
          {accuracy && <AccuracyCircle center={position} radius={accuracy} />}
        </>
      )}
    </>
  );
};

export default LiveLocationToggle;