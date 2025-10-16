import { useEffect, useRef } from "react";
import { MapContainer as LeafletMapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useMapContext } from "../../context/MapContext";
import { MapHashSync } from "./MapHashSync";
import { UnifiedLayer } from "../layers/UnifiedLayer";
import type { BuildingFeature, StreetFeature } from "../../types/geojson";
import type { LatLngArray } from "../../types/map";
import L from "leaflet";

const TILE_LAYER_CONFIG = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors",
  maxZoom: 19,
  maxNativeZoom: 19,
} as const;

interface MapContainerProps {
  filteredBuildings: BuildingFeature[];
  filteredStreets: StreetFeature[];
  showAllLayers: boolean;
  userPosition: LatLngArray | null;
  locationAccuracy: number | null;
  locationError: string | null;
  isLocationTracking: boolean;
}

// Create a custom icon for the user's location
const createLocationIcon = () => {
  return L.divIcon({
    html: `
      <div class="pulse-container">
        <div class="pulse-ring"></div>
        <div class="location-dot">
          <div class="location-dot-inner"></div>
        </div>
      </div>
      <style>
        .pulse-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
        }
        
        .pulse-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 24px;
          height: 24px;
          background-color: rgba(37, 99, 235, 0.3);
          border: 2px solid #2563eb;
          border-radius: 50%;
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .location-dot {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-color: #2563eb;
          border: 3px solid white;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          z-index: 2;
        }
        
        .location-dot-inner {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-color: white;
          border-radius: 50%;
          width: 4px;
          height: 4px;
        }
        
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.5);
            opacity: 0.5;
          }
          100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
          }
        }
      </style>
    `,
    className: 'user-location-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

// Component to handle the flyTo functionality
const LocationFlyTo = ({
  userPosition,
  isLocationTracking
}: {
  userPosition: LatLngArray | null;
  isLocationTracking: boolean;
}) => {
  const map = useMap();
  const hasFocusedRef = useRef(false);

  useEffect(() => {
    if (userPosition && isLocationTracking && !hasFocusedRef.current) {
      console.log('Flying to user location:', userPosition);
      map.flyTo(userPosition, 16, {
        duration: 2
      });
      hasFocusedRef.current = true;
    }

    // Reset the flag when tracking stops so it can focus again next time
    if (!isLocationTracking) {
      hasFocusedRef.current = false;
    }
  }, [userPosition, isLocationTracking, map]);

  return null;
};

export const MapContainer = ({
  filteredBuildings,
  filteredStreets,
  showAllLayers,
  userPosition,
  locationAccuracy,
  locationError,
  isLocationTracking
}: MapContainerProps) => {
  const { mapState } = useMapContext();
  const locationIconRef = useRef<L.DivIcon | null>(null);

  // Initialize the location icon
  if (!locationIconRef.current) {
    locationIconRef.current = createLocationIcon();
  }

  // Detect if we're on a mobile device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  return (
    <LeafletMapContainer
      center={mapState.center}
      zoom={mapState.zoom}
      zoomControl={false}
      scrollWheelZoom={!isMobile} // Disable scroll wheel zoom on mobile to improve performance
      touchZoom={isMobile} // Enable touch zoom on mobile
      className="h-full w-full"
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url={TILE_LAYER_CONFIG.url}
        attribution={TILE_LAYER_CONFIG.attribution}
        maxZoom={TILE_LAYER_CONFIG.maxZoom}
        maxNativeZoom={TILE_LAYER_CONFIG.maxNativeZoom}
      />
      <MapHashSync />
      <UnifiedLayer
        buildingFeatures={filteredBuildings}
        streetFeatures={filteredStreets}
        showAllLayers={showAllLayers}
      />

      {/* Component to handle flyTo functionality */}
      <LocationFlyTo
        userPosition={userPosition}
        isLocationTracking={isLocationTracking}
      />

      {/* User location marker */}
      {userPosition && (
        <Marker
          position={userPosition}
          icon={locationIconRef.current}
        >
          <Popup>
            <div>
              <strong>Tu ubicación</strong>
              {locationAccuracy && (
                <p>Precisión: ±{Math.round(locationAccuracy)} metros</p>
              )}
              {locationError && (
                <p style={{ color: 'red' }}>Error: {locationError}</p>
              )}
            </div>
          </Popup>
        </Marker>
      )}
    </LeafletMapContainer>
  );
};
