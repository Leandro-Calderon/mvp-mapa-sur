import { FeatureGroup, Polyline, Polygon, Popup } from "react-leaflet";
import type { StreetFeature } from "../types/geojson";

interface streetsListProps {
  features: StreetFeature[];
}

// Type guards for coordinate validation
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
): value is [number, number][][] => {
  // Polygon coordinates are an array of rings (outer + holes)
  // Each ring is an array of coordinate pairs
  return Array.isArray(value) &&
    value.length > 0 &&
    value.every(isLineStringCoordinates);
};

/**
 * Convert GeoJSON coordinates [lng, lat] to Leaflet format [lat, lng]
 */
const toLeafletCoords = (coords: [number, number][]): [number, number][] => {
  return coords.map(([lng, lat]) => [lat, lng] as [number, number]);
};

/**
 * Component to render street GeoJSON features with popups
 * Supports LineString, MultiLineString, and Polygon geometries
 * @param features - Array of GeoJSON features
 */
export const StreetsList = ({ features }: streetsListProps) => {
  return (
    <FeatureGroup>
      {features.map((feature, index) => {
        const { coordinates, type } = feature.geometry;
        const { nombre, tipo } = feature.properties;

        const popupContent = (
          <Popup>
            <strong>{nombre}</strong>
            <br />
            Tipo: {tipo}
          </Popup>
        );

        // Handle LineString geometry
        if (type === "LineString" && isLineStringCoordinates(coordinates)) {
          const leafletPositions = toLeafletCoords(coordinates);
          return (
            <Polyline
              key={index}
              positions={leafletPositions}
              pathOptions={{ color: "cyan", weight: 5, opacity: 1 }}
            >
              {popupContent}
            </Polyline>
          );
        }

        // Handle MultiLineString geometry
        if (type === "MultiLineString" && isMultiLineStringCoordinates(coordinates)) {
          const leafletPositions = coordinates.map(toLeafletCoords);
          return (
            <Polyline
              key={index}
              positions={leafletPositions}
              pathOptions={{ color: "cyan", weight: 5, opacity: 1 }}
            >
              {popupContent}
            </Polyline>
          );
        }

        // Handle Polygon geometry
        if (type === "Polygon" && isPolygonCoordinates(coordinates)) {
          const leafletPositions = coordinates.map(toLeafletCoords);
          return (
            <Polygon
              key={index}
              positions={leafletPositions}
              pathOptions={{
                color: "cyan",
                weight: 5,
                opacity: 1,
                fillColor: "cyan",
                fillOpacity: 0.3
              }}
            >
              {popupContent}
            </Polygon>
          );
        }

        // Unknown geometry type - skip
        return null;
      })}
    </FeatureGroup>
  );
};
