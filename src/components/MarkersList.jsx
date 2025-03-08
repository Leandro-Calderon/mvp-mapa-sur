import { FeatureGroup, Marker, Popup } from "react-leaflet";
import { customIcon } from "../constants/mapIcons";

export const MarkersList = ({ features }) => {
  return (
    <FeatureGroup>
      {features.map((feature, index) => (
        <Marker
          icon={customIcon}
          key={index}
          position={feature.geometry.coordinates.reverse()}
        >
          <Popup>
            {feature.properties.tipo}: {feature.properties.nombre} - Plan{" "}
            {feature.properties.plan}
          </Popup>
        </Marker>
      ))}
    </FeatureGroup>
  );
};
