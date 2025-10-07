import { FeatureGroup, Polyline, Popup } from "react-leaflet";

interface StreetFeature {
  geometry: {
    coordinates: [number, number][];
  };
  properties: {
    nombre: string;
    tipo: string;
  };
}

interface StreetsListProps {
  features: StreetFeature[];
}

/**
 * Component to render street GeoJSON LineStrings with popups
 * @param features - Array of GeoJSON features with LineString geometry
 */
export const StreetsList = ({ features }: StreetsListProps) => {
  console.log('=== STREETSLIST RENDER ===');
  console.log('Features to render:', features.length);

  return (
    <FeatureGroup>
      {features.map((feature, index) => {
        // Convert GeoJSON coordinates [lng, lat] to Leaflet format [lat, lng]
        const positions = feature.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

        console.log(`Street ${index}: ${feature.properties.nombre}`);
        console.log('  Original coords:', feature.geometry.coordinates);
        console.log('  Leaflet positions:', positions);

        return (
          <Polyline
            key={index}
            positions={positions}
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
