import { FeatureGroup, Marker, Popup, Polyline } from "react-leaflet";
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
            // Handle both LineString (number[][]) and MultiLineString (number[][][]) coordinates
            const coordinates = feature.geometry.coordinates;

            let lineStrings: [number, number][][] | null = null;

            if (feature.geometry.type === "LineString" &&
              isLineStringCoordinates(coordinates)) {
              lineStrings = [coordinates];
            } else if (feature.geometry.type === "MultiLineString" &&
              isMultiLineStringCoordinates(coordinates)) {
              lineStrings = coordinates;
            }

            if (!lineStrings) {
              return null;
            }

            // Convert all coordinates from [lng, lat] to [lat, lng] for Leaflet
            const leafletPositions = lineStrings.map((lineString) =>
              lineString.map(([lng, lat]) => [lat, lng] as [number, number]),
            );

            return (
              <Polyline
                key={`street-${index}`}
                positions={leafletPositions as [number, number][][]}
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
          })}
        </FeatureGroup>
      )}
    </>
  );
};