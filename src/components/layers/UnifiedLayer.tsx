import { FeatureGroup, Marker, Popup, Polyline, Polygon } from "react-leaflet";
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
  console.log('UnifiedLayer: Rendering with', {
    buildingFeaturesCount: buildingFeatures.length,
    streetFeaturesCount: streetFeatures.length,
    showAllLayers
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
                <Polygon
                  key={`street-${index}`}
                  positions={leafletPositions}
                  pathOptions={{
                    color: "blue",
                    weight: 3,
                    opacity: 1,
                    fillColor: "#3388ff",
                    fillOpacity: 0.3,
                  }}
                >
                  <Popup>
                    <strong>{feature.properties.nombre}</strong>
                    <br />
                    Tipo: {feature.properties.tipo}
                  </Popup>
                </Polygon>
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