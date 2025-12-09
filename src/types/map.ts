import React from 'react';
import type { Map as MapLibreMap, LngLat, LngLatBounds as MapLibreBounds } from 'maplibre-gl';
import type { BuildingFilters, StreetFilters } from './filters';

// Basic coordinate types (GeoJSON standard: [lng, lat])
export interface LngLatLike {
  lng: number;
  lat: number;
}

export type LngLatArray = [number, number]; // [longitude, latitude] - GeoJSON standard

export interface LatLngBounds {
  getNorth: () => number;
  getSouth: () => number;
  getEast: () => number;
  getWest: () => number;
}

// Map instance type - now uses MapLibre
export type MapInstance = MapLibreMap;

// Re-export MapLibre types for convenience
export type { LngLat, MapLibreBounds };

// Map state for context
export interface MapState {
  center: LngLatArray; // [lng, lat]
  zoom: number;
  bearing?: number;
  pitch?: number;
}

// Map view state for react-map-gl
export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  bearing?: number;
  pitch?: number;
}

// Context types
export interface MapContextValue {
  mapState: MapState;
  setMapState: (_state: Partial<MapState>) => void;
  mapRef: React.MutableRefObject<MapInstance | null>;
  setMapReference: (_map: MapInstance) => void;
}

// Hook return types
export interface DataHookResult<T> {
  data: T;
  loading: boolean;
  error: Error | null;
}

// Component prop types
export interface MapComponentProps {
  center?: LngLatArray;
  zoom?: number;
  className?: string;
  style?: React.CSSProperties;
}

export interface FilterComponentProps {
  filters: BuildingFilters | StreetFilters;
  onFilterChange: (_filters: BuildingFilters | StreetFilters) => void;
}

// Map style types
export type MapStyleId = 'liberty' | 'dark' | 'satellite';

export interface MapStyleConfig {
  id: MapStyleId;
  name: string;
  url: string;
}

// Popup state
export interface PopupInfo {
  longitude: number;
  latitude: number;
  properties: Record<string, unknown>;
  layerId: string;
}
