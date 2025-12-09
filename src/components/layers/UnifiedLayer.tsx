/**
 * UnifiedLayer - Legacy compatibility layer
 * 
 * This component is no longer used as markers and layers are now rendered
 * directly in MapContainer.tsx using react-map-gl's Source and Layer components.
 * 
 * The functionality has been moved to:
 * - MapContainer.tsx: Buildings layer with clustering, streets layer
 * 
 * This file is kept for reference but can be safely deleted.
 */

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