/**
 * FonaviMarkers - Legacy compatibility layer
 * 
 * This component is no longer used as markers are now rendered
 * using MapLibre GL's native clustering and circle layers in MapContainer.tsx.
 * 
 * The functionality has been moved to:
 * - MapContainer.tsx: Buildings source with clustering, unclustered-point layer
 * 
 * This file is kept for reference but can be safely deleted.
 */

import type { BuildingFeature } from "../types/geojson";

// Color configuration used by MapContainer layers
export const COLOR_MAP: Record<string, string> = {
  'Bloque': '#FF6B6B',      // Rojo suave
  'Torre': '#4ECDC4',       // Turquesa
  'Departamento': '#45B7D1', // Azul
};

export const DEFAULT_COLOR = '#95A5A6'; // Gris para tipos desconocidos

interface FonaviMarkersProps {
  features: BuildingFeature[];
}

/**
 * @deprecated Markers are now rendered in MapContainer using react-map-gl Source/Layer
 */
export const FonaviMarkers = (_props: FonaviMarkersProps) => {
  // This component is no longer used
  // All marker rendering is now in MapContainer.tsx
  return null;
};

FonaviMarkers.displayName = 'FonaviMarkers';