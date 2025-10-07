import { FeatureGroup, Marker, Popup } from "react-leaflet";
import { customIcon } from "../constants/mapIcons";

interface Feature {
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    tipo: string;
    nombre: string;
    plan: string;
  };
}

interface MarkersListProps {
  features: Feature[];
}

export const MarkersList = ({ features }: MarkersListProps) => {
  return (
    <FeatureGroup>
      {features.map((feature, index) => {
        // Create immutable reversed coordinates [lat, lng] for Leaflet
        const [lng, lat] = feature.geometry.coordinates;

        return (
          <Marker
            icon={customIcon}
            key={index}
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
  );
};
