import type { BuildingFeature, StreetFeature } from "../../types/geojson";

interface UnifiedLayerProps {
  buildingFeatures: BuildingFeature[];
  streetFeatures: StreetFeature[];
  showAllLayers: boolean;
}

/**
 * @deprecated Layers are now rendered in MapContainer using react-map-gl Source/Layer
 */
export const UnifiedLayer = (_props: UnifiedLayerProps) => {
  // This component is no longer used
  // All layer rendering is now in MapContainer.tsx
  return null;
};

UnifiedLayer.displayName = 'UnifiedLayer';
