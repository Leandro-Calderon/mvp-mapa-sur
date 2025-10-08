import { FeatureGroup, Polyline, Popup } from "react-leaflet";
import type { StreetFeature } from "../types/geojson";

interface streetsListProps {
  features: StreetFeature[];
}

/**
 * Component to render street GeoJSON LineStrings with popups
 * @param features - Array of GeoJSON features with LineString geometry
 */
export const StreetsList = ({ features }: streetsListProps) => {
  console.log('=== STREETSLIST RENDER ===');
  console.log('Features to render:', features.length);

  return (
    <FeatureGroup>
      {features.map((feature, index) => {
        // Handle both LineString (number[][]) and MultiLineString (number[][][]) coordinates
        const coordinates = feature.geometry.coordinates;

        // Normalize to array of LineString coordinates and convert to Leaflet format [lat, lng]
        const lineStrings: number[][][] = Array.isArray(coordinates[0][0])
          ? coordinates as number[][][]
          : [coordinates as number[][]];

        // Convert all coordinates from [lng, lat] to [lat, lng] for Leaflet
        const leafletPositions = lineStrings.map(lineString =>
          lineString.map(([lng, lat]) => [lat, lng])
        );
        return (
          <Polyline
            key={index}
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
  );
};
