import { Source, Layer } from 'react-map-gl/maplibre';
import type { BuildingFeature, StreetFeature } from '../../types/geojson';
import type { LngLatArray } from '../../types/map';
import {
  buildingsToGeoJSON,
  streetsToGeoJSON,
  buildUserLocationFeatureCollection,
} from '../../utils/geojson';

// Layer paint configurations
const STREET_LINE_PAINT = {
  'line-color': '#00bcd4',
  'line-width': 5,
  'line-opacity': 0.9,
} as const;

const STREET_FILL_PAINT = {
  'fill-color': '#3388ff',
  'fill-opacity': 0.4,
  'fill-outline-color': '#0066cc',
} as const;

interface BuildingsLayerProps {
  buildings: BuildingFeature[];
}

// Buildings layer (no clustering - colors by type)
export const BuildingsLayer = ({ buildings }: BuildingsLayerProps) => (
  <Source
    id="fonavi-buildings"
    type="geojson"
    data={buildingsToGeoJSON(buildings)}
  >
    {/* Points colored by building type */}
    <Layer
      id="unclustered-point"
      type="circle"
      paint={{
        'circle-color': [
          'match',
          ['get', 'tipo'],
          'Bloque', '#FF6B6B',      // Red for Bloque
          'Torre', '#4ECDC4',        // Turquoise for Torre
          'Departamento', '#45B7D1', // Light blue for Departamento
          '#95A5A6'                  // Gray default
        ],
        'circle-radius': 10,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
      }}
    />
  </Source>
);

interface StreetsLayerProps {
  streets: StreetFeature[];
}

// Streets layer
export const StreetsLayer = ({ streets }: StreetsLayerProps) => (
  <Source id="streets" type="geojson" data={streetsToGeoJSON(streets)}>
    {/* Line geometries */}
    <Layer
      id="street-lines"
      type="line"
      filter={['any',
        ['==', ['geometry-type'], 'LineString'],
        ['==', ['geometry-type'], 'MultiLineString']
      ]}
      paint={STREET_LINE_PAINT}
    />

    {/* Polygon fills */}
    <Layer
      id="street-fills"
      type="fill"
      filter={['==', ['geometry-type'], 'Polygon']}
      paint={STREET_FILL_PAINT}
    />

    {/* Polygon outlines */}
    <Layer
      id="street-outlines"
      type="line"
      filter={['==', ['geometry-type'], 'Polygon']}
      paint={{
        'line-color': '#0066cc',
        'line-width': 3,
      }}
    />
  </Source>
);

interface UserLocationLayerProps {
  userPosition: LngLatArray | null;
  locationAccuracy: number | null;
  isLocationTracking: boolean;
}

// User location (rendered only while tracking with a known position)
export const UserLocationLayer = ({
  userPosition,
  locationAccuracy,
  isLocationTracking,
}: UserLocationLayerProps) => {
  const userLocationGeoJSON = buildUserLocationFeatureCollection(userPosition, locationAccuracy);

  if (!userLocationGeoJSON || !isLocationTracking) {
    return null;
  }

  return (
    <Source id="user-location" type="geojson" data={userLocationGeoJSON}>
      {/* Accuracy circle */}
      {locationAccuracy && (
        <Layer
          id="user-location-accuracy"
          type="circle"
          paint={{
            'circle-radius': ['/', locationAccuracy, 2],
            'circle-color': 'rgba(37, 99, 235, 0.15)',
            'circle-stroke-color': 'rgba(37, 99, 235, 0.3)',
            'circle-stroke-width': 1,
          }}
        />
      )}
      {/* User dot */}
      <Layer
        id="user-location-dot"
        type="circle"
        paint={{
          'circle-radius': 8,
          'circle-color': '#2563eb',
          'circle-stroke-width': 3,
          'circle-stroke-color': '#fff',
        }}
      />
    </Source>
  );
};
