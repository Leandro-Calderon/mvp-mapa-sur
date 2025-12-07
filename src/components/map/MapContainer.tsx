import { useEffect, useRef } from "react";
import { MapContainer as LeafletMapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import { useMapContext } from "../../context/MapContext";
import { MapHashSync } from "./MapHashSync";
import { UnifiedLayer } from "../layers/UnifiedLayer";
import type { BuildingFeature, StreetFeature } from "../../types/geojson";
import type { LatLngArray } from "../../types/map";
import L from "leaflet";
import { logger } from "../../utils/logger";
import { isMobile } from "../../utils/deviceDetection";

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
  searchRevision: number;
  onMapClick?: () => void;
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
      logger.debug('Flying to user location:', userPosition);
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

// Component to handle flying to search results
const SearchResultsFlyTo = ({
  buildings,
  streets,
  searchRevision
}: {
  buildings: BuildingFeature[];
  streets: StreetFeature[];
  searchRevision: number;
}) => {
  const map = useMap();
  const lastRevisionRef = useRef(0);

  useEffect(() => {
    // Only trigger on new searches (revision changed)
    if (searchRevision === 0 || searchRevision === lastRevisionRef.current) {
      return;
    }

    const totalResults = buildings.length + streets.length;
    if (totalResults === 0) {
      return;
    }

    lastRevisionRef.current = searchRevision;
    logger.debug('SearchResultsFlyTo: Flying to search results', { totalResults, searchRevision });

    // Build bounds from all results
    const bounds = L.latLngBounds([]);

    // Add building coordinates (Points)
    buildings.forEach((building) => {
      const [lng, lat] = building.geometry.coordinates;
      bounds.extend([lat, lng]);
    });

    // Add street coordinates (LineString, MultiLineString, or Polygon)
    streets.forEach((street) => {
      const { type, coordinates } = street.geometry;

      if (type === 'LineString') {
        // coordinates is number[][]
        (coordinates as number[][]).forEach(([lng, lat]) => {
          bounds.extend([lat, lng]);
        });
      } else if (type === 'MultiLineString' || type === 'Polygon') {
        // coordinates is number[][][]
        (coordinates as number[][][]).forEach((line) => {
          line.forEach(([lng, lat]) => {
            bounds.extend([lat, lng]);
          });
        });
      }
    });

    if (!bounds.isValid()) {
      logger.warn('SearchResultsFlyTo: Invalid bounds, skipping navigation');
      return;
    }

    // Single result: flyTo with high zoom
    if (totalResults === 1) {
      const center = bounds.getCenter();
      map.flyTo(center, 17, { duration: 1.5 });
    } else {
      // Multiple results: fitBounds to show all
      map.flyToBounds(bounds, {
        padding: [50, 50],
        duration: 1.5,
        maxZoom: 17
      });
    }
  }, [buildings, streets, searchRevision, map]);

  return null;
};

// Component to handle map click events for closing panels
const MapClickHandler = ({
  onMapClick
}: {
  onMapClick?: () => void;
}) => {
  useMapEvents({
    click: (e) => {
      // Check if click was on an empty area (not on a marker or interactive element)
      // Leaflet sets originalEvent.target to the map container for empty clicks
      const target = e.originalEvent?.target as HTMLElement;

      // If clicking on a Leaflet interactive element (marker, polygon, etc.), ignore
      if (target?.closest('.leaflet-interactive') || target?.closest('.leaflet-marker-icon')) {
        return;
      }

      logger.debug('MapClickHandler: Map empty area clicked');
      onMapClick?.();
    },
    popupopen: () => {
      // When a popup opens (clicking on a marker/street), also collapse the panel
      logger.debug('MapClickHandler: Popup opened, collapsing panel');
      onMapClick?.();
    }
  });

  return null;
};

export const MapContainer = ({
  filteredBuildings,
  filteredStreets,
  showAllLayers,
  userPosition,
  locationAccuracy,
  locationError,
  isLocationTracking,
  searchRevision,
  onMapClick
}: MapContainerProps) => {
  const { mapState } = useMapContext();
  const locationIconRef = useRef<L.DivIcon | null>(null);

  // Initialize the location icon
  if (!locationIconRef.current) {
    locationIconRef.current = createLocationIcon();
  }

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
      <MapClickHandler onMapClick={onMapClick} />
      <UnifiedLayer
        buildingFeatures={filteredBuildings}
        streetFeatures={filteredStreets}
        showAllLayers={showAllLayers}
      />

      {/* Component to handle flyTo functionality for user location */}
      <LocationFlyTo
        userPosition={userPosition}
        isLocationTracking={isLocationTracking}
      />

      {/* Component to handle flyTo functionality for search results */}
      <SearchResultsFlyTo
        buildings={filteredBuildings}
        streets={filteredStreets}
        searchRevision={searchRevision}
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
