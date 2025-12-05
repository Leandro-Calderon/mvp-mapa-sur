import { FonaviMarkers } from "./FonaviMarkers";
import type { BuildingFeature } from "../types/geojson";

interface MarkersListProps {
  features: BuildingFeature[];
}

export const MarkersList = ({ features }: MarkersListProps) => {
  return (
    <FonaviMarkers features={features} />
  );
};
