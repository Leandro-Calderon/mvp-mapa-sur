import type { BuildingFeature, StreetFeature } from '../types/geojson';
import type { LngLatArray } from '../types/map';

// Convert BuildingFeature[] to GeoJSON FeatureCollection
export const buildingsToGeoJSON = (buildings: BuildingFeature[]) => ({
  type: 'FeatureCollection' as const,
  features: buildings.map((b, idx) => ({
    type: 'Feature' as const,
    id: idx,
    geometry: b.geometry,
    properties: {
      ...b.properties,
      _id: idx,
    },
  })),
});

// Convert StreetFeature[] to GeoJSON FeatureCollection
export const streetsToGeoJSON = (streets: StreetFeature[]) => ({
  type: 'FeatureCollection' as const,
  features: streets.map((s, idx) => ({
    type: 'Feature' as const,
    id: idx,
    geometry: s.geometry,
    properties: {
      ...s.properties,
      _id: idx,
    },
  })),
});

// Build the user location FeatureCollection (null when there is no position)
export const buildUserLocationFeatureCollection = (
  userPosition: LngLatArray | null,
  locationAccuracy: number | null,
) => userPosition ? {
  type: 'FeatureCollection' as const,
  features: [{
    type: 'Feature' as const,
    geometry: {
      type: 'Point' as const,
      coordinates: userPosition,
    },
    properties: {
      accuracy: locationAccuracy,
    },
  }],
} : null;
