import { memo, useMemo } from "react";
import { FeatureGroup, Popup, Polyline, Polygon, useMap } from "react-leaflet";
import { FonaviMarkers } from "../FonaviMarkers";
import type { BuildingFeature, StreetFeature } from "../../types/geojson";
import { logger } from "../../utils/logger";
import { isMobile } from "../../utils/deviceDetection";

// Type guard functions for street coordinates validation (moved outside component)
const isLngLatPair = (value: unknown): value is [number, number] => {
  return Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number";
};

const isLineStringCoordinates = (
  value: unknown,
): value is [number, number][] => {
  return Array.isArray(value) &&
    value.length > 0 &&
    value.every(isLngLatPair);
};

const isMultiLineStringCoordinates = (
  value: unknown,
): value is [number, number][][] => {
  return Array.isArray(value) &&
    value.length > 0 &&
    value.every(isLineStringCoordinates);
};

const isPolygonCoordinates = (
  value: unknown,
): value is [number, number][][][] => {
  return Array.isArray(value) &&
    value.length > 0 &&
    value.every((ring) =>
      Array.isArray(ring) &&
      ring.length > 0 &&
      ring.every(isLngLatPair)
    );
};

// Simplify polygon coordinates for mobile performance
const simplifyPolygon = (coordinates: number[][][]) => {
  if (!isMobile) return coordinates;

  // Simplify polygon coordinates for better performance on mobile
  // Filter out some points to reduce complexity
  return coordinates.map(ring =>
    ring.length > 20 ? ring.filter((_, i) => i % 2 === 0) : ring
  );
};

interface UnifiedLayerProps {
  buildingFeatures: BuildingFeature[];
  streetFeatures: StreetFeature[];
  showAllLayers: boolean;
}

export const UnifiedLayer = memo(({
  buildingFeatures,
  streetFeatures,
  showAllLayers
}: UnifiedLayerProps) => {
  const map = useMap();

  logger.debug('UnifiedLayer: Rendering with', {
    buildingFeaturesCount: buildingFeatures.length,
    streetFeaturesCount: streetFeatures.length,
    showAllLayers,
    isMobile
  });

  // Memoize display decisions
  const shouldShowBuildings = useMemo(() =>
    showAllLayers || buildingFeatures.length > 0,
    [showAllLayers, buildingFeatures.length]
  );

  const shouldShowStreets = useMemo(() =>
    showAllLayers || streetFeatures.length > 0,
    [showAllLayers, streetFeatures.length]
  );


  logger.debug('UnifiedLayer: Display decisions', {
    shouldShowBuildings,
    shouldShowStreets
  });

  // Mobile-optimized polygon component
  const MobilePolygon = ({
    positions,
    feature,
    index
  }: {
    positions: number[][][];
    feature: StreetFeature;
    index: number;
  }) => {
    const simplifiedPositions = simplifyPolygon(positions);

    // Adjust stroke width based on device type
    const strokeWidth = isMobile ? 4 : 3;
    const fillOpacity = isMobile ? 0.4 : 0.3;

    return (
      <Polygon
        key={`street-${index}`}
        positions={simplifiedPositions as [number, number][][]}
        pathOptions={{
          color: "blue",
          weight: strokeWidth,
          opacity: 1,
          fillColor: "#3388ff",
          fillOpacity: fillOpacity,
          className: isMobile ? "mobile-polygon" : "",
        }}
        eventHandlers={{
          click: (e) => {
            // Ensure popup opens properly on touch devices
            const polygon = e.target;
            if (polygon && polygon.bindPopup) {
              polygon.bindPopup(`
                <div>
                  <strong>${feature.properties.nombre}</strong>
                  <br />
                  Tipo: ${feature.properties.tipo}
                </div>
              `).openPopup(e.latlng);
            }
          },
        }}
      >
        <Popup>
          <strong>{feature.properties.nombre}</strong>
          <br />
          Tipo: {feature.properties.tipo}
        </Popup>
      </Polygon>
    );
  };

  return (
    <>
      {/* Building markers with CircleMarker */}
      {shouldShowBuildings && buildingFeatures.length > 0 && (
        <FeatureGroup>
          <FonaviMarkers features={buildingFeatures} />
        </FeatureGroup>
      )}

      {/* Street polylines */}
      {shouldShowStreets && streetFeatures.length > 0 && (
        <FeatureGroup>
          {streetFeatures.map((feature, index) => {
            const coordinates = feature.geometry.coordinates;

            // Handle LineString geometry
            if (feature.geometry.type === "LineString" &&
              isLineStringCoordinates(coordinates)) {
              const leafletPositions = coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);

              return (
                <Polyline
                  key={`street-${index}`}
                  positions={leafletPositions}
                  pathOptions={{
                    color: "cyan",
                    weight: 5,
                    opacity: 1,
                  }}
                >
                  <Popup>
                    <strong>{feature.properties.nombre}</strong>
                    <br />
                    Tipo: {feature.properties.tipo}
                  </Popup>
                </Polyline>
              );
            }

            // Handle MultiLineString geometry
            if (feature.geometry.type === "MultiLineString" &&
              isMultiLineStringCoordinates(coordinates)) {
              const leafletPositions = coordinates.map((lineString) =>
                lineString.map(([lng, lat]) => [lat, lng] as [number, number])
              );

              return (
                <Polyline
                  key={`street-${index}`}
                  positions={leafletPositions}
                  pathOptions={{
                    color: "cyan",
                    weight: 5,
                    opacity: 1,
                  }}
                >
                  <Popup>
                    <strong>{feature.properties.nombre}</strong>
                    <br />
                    Tipo: {feature.properties.tipo}
                  </Popup>
                </Polyline>
              );
            }

            // Handle Polygon geometry
            if (feature.geometry.type === "Polygon" &&
              isPolygonCoordinates(coordinates)) {
              const leafletPositions = coordinates.map((ring) =>
                (ring as unknown as [number, number][]).map(([lng, lat]) => [lat, lng] as [number, number])
              );

              return (
                <MobilePolygon
                  key={`street-polygon-${index}`}
                  positions={leafletPositions}
                  feature={feature}
                  index={index}
                />
              );
            }

            // If geometry type is not supported, return null
            return null;
          })}
        </FeatureGroup>
      )}
    </>
  );
});

UnifiedLayer.displayName = 'UnifiedLayer';