/**
 * StreetsList - Legacy compatibility layer
 * 
 * This component is no longer used as street rendering is now done
 * using MapLibre GL's native GeoJSON source and layer in MapContainer.tsx.
 * 
 * This file is kept for reference but can be safely deleted.
 */

import type { StreetFeature } from "../types/geojson";

interface StreetsListProps {
  features: StreetFeature[];
}

/**
 * @deprecated Streets are now rendered in MapContainer using react-map-gl Source/Layer
 */
export const StreetsList = (_props: StreetsListProps) => {
  // This component is no longer used
  // All street rendering is now in MapContainer.tsx
  return null;
};
