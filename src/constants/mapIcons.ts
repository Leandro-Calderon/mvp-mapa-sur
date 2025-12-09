/**
 * mapIcons - Legacy compatibility layer
 * 
 * This file previously contained Leaflet icon configurations.
 * With MapLibre GL JS, icons are now handled differently:
 * - Circle markers use layer paint properties
 * - Custom icons would use symbol layers with sprite/image sources
 * 
 * This file is kept for reference but can be safely deleted.
 */

// Color configuration for FONAVI marker types
// Used by MapContainer.tsx layer paint properties
export const MARKER_COLORS = {
  Bloque: '#FF6B6B',      // Rojo suave
  Torre: '#4ECDC4',       // Turquesa
  Departamento: '#45B7D1', // Azul
  default: '#95A5A6',      // Gris para tipos desconocidos
} as const;

// Location marker color
export const LOCATION_COLOR = '#4285F4';
