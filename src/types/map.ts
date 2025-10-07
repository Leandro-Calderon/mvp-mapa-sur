// Leaflet and React-Leaflet type definitions
import L from 'leaflet';
import type { BuildingFilters, StreetFilters } from './filters';

// Basic Leaflet types
export interface LatLng {
  lat: number;
  lng: number;
}

export type LatLngArray = [number, number]; // [latitude, longitude]

export interface LatLngBounds {
  getNorth: () => number;
  getSouth: () => number;
  getEast: () => number;
  getWest: () => number;
}

// Map instance type wrapper
export interface MapInstance {
  getCenter: () => L.LatLng;
  getZoom: () => number;
  setView: (center: L.LatLngExpression, zoom?: number) => MapInstance;
  addLayer: (layer: L.Layer) => MapInstance;
  removeLayer: (layer: L.Layer) => MapInstance;
  fitBounds: (bounds: L.LatLngBoundsExpression, options?: L.FitBoundsOptions) => MapInstance;
  getBounds: () => L.LatLngBounds;
  setZoom: (zoom: number) => MapInstance;
  panTo: (latlng: L.LatLngExpression) => MapInstance;
  flyTo: (latlng: L.LatLngExpression, zoom?: number) => MapInstance;
}

// Icon wrapper type
export interface IconOptions {
  iconUrl?: string;
  iconSize?: L.PointTuple;
  iconAnchor?: L.PointTuple;
  popupAnchor?: L.PointTuple;
  shadowUrl?: string;
  shadowSize?: L.PointTuple;
  className?: string;
  html?: string;
}

export interface CustomIcon extends L.Icon {
  options: IconOptions & L.IconOptions;
}

// Marker wrapper type
export interface MarkerInstance {
  addTo: (map: MapInstance) => MarkerInstance;
  bindPopup: (content: string | HTMLElement) => MarkerInstance;
  openPopup: () => MarkerInstance;
  closePopup: () => MarkerInstance;
  setLatLng: (latlng: L.LatLngExpression) => MarkerInstance;
  getLatLng: () => L.LatLng;
}

// Layer wrapper type
export interface LayerInstance {
  addTo: (map: MapInstance) => LayerInstance;
  remove: () => LayerInstance;
}

// Context types
export interface MapContextValue {
  mapState: MapState;
  setMapState: (state: Partial<Omit<MapState, 'center'>> & { center?: LatLng | LatLngArray }) => void;
  mapRef: React.MutableRefObject<MapInstance | null>;
  setMapReference: (map: MapInstance) => void;
}

export interface MapState {
  center: LatLng | LatLngArray;
  zoom: number;
  bounds?: LatLngBounds;
}

// Hook return types
export interface DataHookResult<T> {
  data: T;
  loading: boolean;
  error: Error | null;
}

// Component prop types
export interface MapComponentProps {
  center?: LatLng;
  zoom?: number;
  className?: string;
  style?: React.CSSProperties;
}

export interface FilterComponentProps {
  filters: BuildingFilters | StreetFilters;
  onFilterChange: (filters: BuildingFilters | StreetFilters) => void;
}
