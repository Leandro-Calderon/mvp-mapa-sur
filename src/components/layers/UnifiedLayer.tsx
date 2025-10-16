import { FeatureGroup, Marker, Popup, Polyline, Polygon, useMap } from "react-leaflet";
import { customIcon } from "../../constants/mapIcons";
import type { BuildingFeature, StreetFeature } from "../../types/geojson";

interface UnifiedLayerProps {
  buildingFeatures: BuildingFeature[];
  streetFeatures: StreetFeature[];
  showAllLayers: boolean;
}

export const UnifiedLayer = ({
  buildingFeatures,
  streetFeatures,
  showAllLayers
}: UnifiedLayerProps) => {
  const map = useMap();

  // Detect if we're on a mobile device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  console.log('UnifiedLayer: Rendering with', {
    buildingFeaturesCount: buildingFeatures.length,
    streetFeaturesCount: streetFeatures.length,
    showAllLayers,
    isMobile
  });

  // Show layers when "See all" is enabled OR when there are filtered results
  const shouldShowBuildings = showAllLayers || buildingFeatures.length > 0;
  const shouldShowStreets = showAllLayers || streetFeatures.length > 0;

  console.log('UnifiedLayer: Display decisions', {
    shouldShowBuildings,
    shouldShowStreets
  });

  // Type guard functions for street coordinates validation
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
      {/* Building markers */}
      {shouldShowBuildings && buildingFeatures.length > 0 && (
        <FeatureGroup>
          {buildingFeatures.map((feature, index) => {
            // Create immutable reversed coordinates [lat, lng] for Leaflet
            const [lng, lat] = feature.geometry.coordinates;

            return (
              <Marker
                icon={customIcon}
                key={`building-${index}`}
                position={[lat, lng]}
              >
                <Popup>
                  {feature.properties.tipo}: {feature.properties.nombre} - Plan{" "}
                  {feature.properties.plan}
                </Popup>
              </Marker>
            );
          })}
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
};