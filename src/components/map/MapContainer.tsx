import { useCallback, useRef, useState, memo, useEffect } from "react";
import Map, {
  Source,
  Layer,
  Popup,
  type MapRef,
  type ViewStateChangeEvent,
  type MapLayerMouseEvent,
} from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import type { GeoJSONSource, CirclePaint, SymbolLayout } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useMapContext } from "../../context/MapContext";
import { MapHashSync } from "./MapHashSync";
import { StyleSelector } from "./StyleSelector";
import { MAP_STYLES, DEFAULT_STYLE } from "../../constants/mapStyles";
import type { BuildingFeature, StreetFeature } from "../../types/geojson";
import type { LngLatArray, MapStyleId, PopupInfo } from "../../types/map";
import { logger } from "../../utils/logger";

// Layer paint configurations
const CLUSTER_LAYER_PAINT = {
  'circle-color': [
    'step',
    ['get', 'point_count'],
    '#51bbd6',   // < 10 points
    10,
    '#f1f075',  // 10-29 points
    30,
    '#f28cb1'   // >= 30 points
  ],
  'circle-radius': [
    'step',
    ['get', 'point_count'],
    20,    // < 10 points
    10,
    30,   // 10-29 points
    30,
    40    // >= 30 points
  ],
  'circle-stroke-width': 2,
  'circle-stroke-color': '#fff',
} as const;

const CLUSTER_COUNT_LAYOUT = {
  'text-field': '{point_count_abbreviated}',
  'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
  'text-size': 14,
} as const;

const UNCLUSTERED_POINT_PAINT = {
  'circle-color': [
    'match',
    ['get', 'tipo'],
    'Bloque', '#FF6B6B',
    'Torre', '#4ECDC4',
    'Departamento', '#45B7D1',
    '#95A5A6' // default
  ],
  'circle-radius': 8,
  'circle-stroke-width': 2,
  'circle-stroke-color': '#fff',
} as const;

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

interface MapContainerProps {
  filteredBuildings: BuildingFeature[];
  filteredStreets: StreetFeature[];
  showAllLayers: boolean;
  userPosition: LngLatArray | null;
  locationAccuracy: number | null;
  locationError: string | null;
  isLocationTracking: boolean;
  searchRevision: number;
  onMapClick?: () => void;
}

// Convert BuildingFeature[] to GeoJSON FeatureCollection
const buildingsToGeoJSON = (buildings: BuildingFeature[]) => ({
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
const streetsToGeoJSON = (streets: StreetFeature[]) => ({
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

export const MapContainer = memo(({
  filteredBuildings,
  filteredStreets,
  showAllLayers,
  userPosition,
  locationAccuracy,
  locationError,
  isLocationTracking,
  searchRevision,
  onMapClick,
}: MapContainerProps) => {
  const { mapState, setMapState, setMapReference } = useMapContext();
  const mapRef = useRef<MapRef>(null);
  const [mapStyle, setMapStyle] = useState<MapStyleId>(DEFAULT_STYLE);
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);
  const lastSearchRevisionRef = useRef(0);
  const lastUserPositionRef = useRef<string | null>(null);

  // FlyTo user position when location tracking starts
  useEffect(() => {
    if (!userPosition || !isLocationTracking) {
      // Reset when tracking stops
      if (!isLocationTracking) {
        lastUserPositionRef.current = null;
      }
      return;
    }

    const positionKey = `${userPosition[0]},${userPosition[1]}`;

    // Only flyTo if this is a new position (first position after starting tracking)
    if (lastUserPositionRef.current === null) {
      const map = mapRef.current?.getMap();
      if (map) {
        logger.debug('MapContainer: Flying to user position', userPosition);
        map.flyTo({
          center: userPosition,
          zoom: 17,
          duration: 1500,
        });
      }
    }

    lastUserPositionRef.current = positionKey;
  }, [userPosition, isLocationTracking]);

  // Handle map load
  const handleMapLoad = useCallback(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      setMapReference(map);
      logger.debug('MapContainer: Map loaded and reference set');
    }
  }, [setMapReference]);

  // Handle view state change
  const handleMove = useCallback((evt: ViewStateChangeEvent) => {
    setMapState({
      center: [evt.viewState.longitude, evt.viewState.latitude],
      zoom: evt.viewState.zoom,
      bearing: evt.viewState.bearing,
      pitch: evt.viewState.pitch,
    });
  }, [setMapState]);

  // Unified click handler for all map interactions
  const handleMapClick = useCallback(async (evt: MapLayerMouseEvent) => {
    const features = evt.features;

    // No features clicked - empty area
    if (!features || features.length === 0) {
      logger.debug('MapContainer: Empty area clicked');
      setPopupInfo(null);
      onMapClick?.();
      return;
    }

    const feature = features[0];
    const layerId = feature.layer?.id;

    logger.debug('MapContainer: Feature clicked', { layerId, properties: feature.properties });

    // Handle cluster click - zoom in
    if (layerId === 'clusters' && feature.properties?.cluster) {
      const map = mapRef.current?.getMap();
      if (map) {
        const clusterId = feature.properties.cluster_id as number;
        const source = map.getSource('fonavi-buildings') as GeoJSONSource;
        const geometry = feature.geometry as { type: 'Point'; coordinates: number[] };
        const coordinates = geometry.coordinates.slice() as [number, number];
        try {
          const zoom = await source.getClusterExpansionZoom(clusterId);
          map.easeTo({
            center: coordinates,
            zoom: zoom ?? 14,
            duration: 500,
          });
        } catch (err) {
          logger.error('MapContainer: Error getting cluster expansion zoom', err);
        }
      }
      return;
    }

    // Handle building (unclustered point) click
    if (layerId === 'unclustered-point') {
      const geometry = feature.geometry as { type: 'Point'; coordinates: number[] };
      const coordinates = geometry.coordinates.slice() as [number, number];

      setPopupInfo({
        longitude: coordinates[0],
        latitude: coordinates[1],
        properties: feature.properties ?? {},
        layerId: 'unclustered-point',
      });
      logger.debug('MapContainer: Building clicked', feature.properties);
      return;
    }

    // Handle street click (lines or polygons)
    if (layerId === 'street-lines' || layerId === 'street-fills') {
      setPopupInfo({
        longitude: evt.lngLat.lng,
        latitude: evt.lngLat.lat,
        properties: feature.properties ?? {},
        layerId: layerId,
      });
      logger.debug('MapContainer: Street clicked', feature.properties);
      return;
    }

    // Unknown layer clicked
    logger.debug('MapContainer: Unknown layer clicked', { layerId });
  }, [onMapClick]);

  // Handle search results navigation
  const handleSearchNavigation = useCallback(() => {
    if (searchRevision === 0 || searchRevision === lastSearchRevisionRef.current) {
      return;
    }

    const totalResults = filteredBuildings.length + filteredStreets.length;
    if (totalResults === 0) return;

    lastSearchRevisionRef.current = searchRevision;
    const map = mapRef.current?.getMap();
    if (!map) return;

    logger.debug('MapContainer: Navigating to search results', { totalResults, searchRevision });

    // Build bounds from all results
    const bounds = new maplibregl.LngLatBounds();

    // Add building coordinates
    filteredBuildings.forEach((building) => {
      const [lng, lat] = building.geometry.coordinates;
      bounds.extend([lng, lat]);
    });

    // Add street coordinates
    filteredStreets.forEach((street) => {
      const { type, coordinates } = street.geometry;

      if (type === 'LineString') {
        (coordinates as number[][]).forEach(([lng, lat]) => {
          bounds.extend([lng, lat]);
        });
      } else if (type === 'MultiLineString' || type === 'Polygon') {
        (coordinates as number[][][]).forEach((line) => {
          line.forEach(([lng, lat]) => {
            bounds.extend([lng, lat]);
          });
        });
      }
    });

    if (bounds.isEmpty()) {
      logger.warn('MapContainer: Empty bounds, skipping navigation');
      return;
    }

    // Single result: flyTo with high zoom
    if (totalResults === 1) {
      const center = bounds.getCenter();
      map.flyTo({ center, zoom: 17, duration: 1500 });
    } else {
      // Multiple results: fitBounds
      map.fitBounds(bounds, {
        padding: 50,
        duration: 1500,
        maxZoom: 17,
      });
    }
  }, [filteredBuildings, filteredStreets, searchRevision]);

  // Trigger search navigation when revision changes
  if (searchRevision !== lastSearchRevisionRef.current) {
    // Use setTimeout to avoid calling during render
    setTimeout(handleSearchNavigation, 0);
  }

  // FitBounds when showAllLayers is activated - using useRef to track previous state
  const prevShowAllLayersRef = useRef(showAllLayers);
  useEffect(() => {
    // Only trigger when showAllLayers changes from false to true
    if (showAllLayers && !prevShowAllLayersRef.current) {
      const map = mapRef.current?.getMap();
      if (map && filteredBuildings.length > 0) {
        console.log('[MapContainer] FitBounds for Ver Todo - all buildings');

        const bounds = new maplibregl.LngLatBounds();

        // Add all building coordinates
        filteredBuildings.forEach((building) => {
          const [lng, lat] = building.geometry.coordinates;
          bounds.extend([lng, lat]);
        });

        // Add street coordinates if any
        filteredStreets.forEach((street) => {
          const { type, coordinates } = street.geometry;
          if (type === 'LineString') {
            (coordinates as number[][]).forEach(([lng, lat]) => bounds.extend([lng, lat]));
          } else if (type === 'MultiLineString' || type === 'Polygon') {
            (coordinates as number[][][]).forEach((line) => {
              line.forEach(([lng, lat]) => bounds.extend([lng, lat]));
            });
          }
        });

        map.fitBounds(bounds, {
          padding: 50,
          duration: 1500,
          maxZoom: 14, // Lower zoom to see all clusters
        });
      }
    }
    prevShowAllLayersRef.current = showAllLayers;
  }, [showAllLayers, filteredBuildings, filteredStreets]);

  // Prepare GeoJSON data
  const buildingsGeoJSON = buildingsToGeoJSON(filteredBuildings);
  const streetsGeoJSON = streetsToGeoJSON(filteredStreets);

  // Determine what to show
  const shouldShowBuildings = showAllLayers || filteredBuildings.length > 0;
  const shouldShowStreets = showAllLayers || filteredStreets.length > 0;

  // Prepare user location GeoJSON
  const userLocationGeoJSON = userPosition ? {
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

  return (
    <Map
      ref={mapRef}
      initialViewState={{
        longitude: mapState.center[0],
        latitude: mapState.center[1],
        zoom: mapState.zoom,
        bearing: mapState.bearing ?? 0,
        pitch: mapState.pitch ?? 0,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle={MAP_STYLES[mapStyle].url}
      onLoad={handleMapLoad}
      onMove={handleMove}
      onClick={handleMapClick}
      interactiveLayerIds={['clusters', 'unclustered-point', 'street-lines', 'street-fills']}
    >
      {/* Hash sync */}
      <MapHashSync />

      {/* Style selector */}
      <StyleSelector
        currentStyle={mapStyle}
        onStyleChange={setMapStyle}
      />

      {/* Buildings layer (no clustering - colors by type) */}
      {shouldShowBuildings && filteredBuildings.length > 0 && (
        <Source
          id="fonavi-buildings"
          type="geojson"
          data={buildingsGeoJSON}
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
      )}

      {/* Streets layer */}
      {shouldShowStreets && filteredStreets.length > 0 && (
        <Source id="streets" type="geojson" data={streetsGeoJSON}>
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
      )}

      {/* User location */}
      {userLocationGeoJSON && isLocationTracking && (
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
      )}

      {/* Popup */}
      {popupInfo && (
        <Popup
          longitude={popupInfo.longitude}
          latitude={popupInfo.latitude}
          anchor="bottom"
          onClose={() => setPopupInfo(null)}
          closeOnClick={false}
        >
          <div style={{ padding: '8px', textAlign: 'center' }}>
            {popupInfo.layerId === 'unclustered-point' ? (
              <>
                <h4 style={{
                  margin: '0 0 8px 0',
                  fontSize: '16px',
                  color: popupInfo.properties.tipo === 'Bloque' ? '#FF6B6B'
                    : popupInfo.properties.tipo === 'Torre' ? '#4ECDC4'
                      : '#45B7D1'
                }}>
                  {String(popupInfo.properties.tipo)}
                </h4>
                {popupInfo.properties.nombre && (
                  <p style={{ margin: '4px 0', fontSize: '14px' }}>
                    <strong>Número:</strong> {String(popupInfo.properties.nombre)}
                  </p>
                )}
                {popupInfo.properties.plan && (
                  <p style={{ margin: '4px 0', fontSize: '14px' }}>
                    <strong>Plan:</strong> {String(popupInfo.properties.plan)}
                  </p>
                )}
              </>
            ) : (
              <>
                <strong>{String(popupInfo.properties.nombre)}</strong>
                <br />
                Tipo: {String(popupInfo.properties.tipo)}
              </>
            )}
          </div>
        </Popup>
      )}
    </Map>
  );
});

MapContainer.displayName = 'MapContainer';
