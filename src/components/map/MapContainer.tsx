import { useCallback, useRef, useState, memo, useEffect, useMemo } from "react";
import Map, {
  Source,
  Layer,
  Popup,
  type MapRef,
  type ViewStateChangeEvent,
  type MapLayerMouseEvent,
} from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import type { GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useMapContext } from "../../context/MapContext";
import { MapHashSync } from "./MapHashSync";
import { StyleSelector } from "./StyleSelector";
import { MAP_STYLES, DEFAULT_STYLE } from "../../constants/mapStyles";
import type { BuildingFeature, StreetFeature } from "../../types/geojson";
import type { LngLatArray, MapStyleId, PopupInfo } from "../../types/map";
import type { GpsErrorInfo } from "../../hooks/useGeolocation";
import { logger } from "../../utils/logger";
import { MapPopupContent } from "./MapPopup";

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

interface MapContainerProps {
  filteredBuildings: BuildingFeature[];
  filteredStreets: StreetFeature[];
  showAllLayers: boolean;
  userPosition: LngLatArray | null;
  locationAccuracy: number | null;
  locationError: GpsErrorInfo | null;
  isLocationTracking: boolean;
  searchRevision: number;
  onMapClick?: () => void;
}

/**
 * Generate a circular polygon GeoJSON Feature in real-world meters.
 * Used for the GPS accuracy circle — renders correctly at any zoom level
 * because it's real coordinates, not pixel-based.
 */
const createAccuracyCircle = (
  center: [number, number],
  radiusMeters: number,
  segments = 64,
): GeoJSON.Feature<GeoJSON.Polygon> => {
  const [lng, lat] = center;
  const coordinates: [number, number][] = [];

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    const dLat = (radiusMeters * Math.cos(angle)) / 111_320;
    const dLng = (radiusMeters * Math.sin(angle)) / (111_320 * Math.cos((lat * Math.PI) / 180));
    coordinates.push([lng + dLng, lat + dLat]);
  }

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates],
    },
  };
};

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
  const [tileError, setTileError] = useState(false);
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
          duration: 2000,
          essential: true,
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

      // Listen for tile load errors — show subtle indicator when offline
      map.on('error', (e: maplibregl.ErrorEvent) => {
        const err = e.error;
        // Tile-related errors (network failure, CORS, etc.)
        if (err?.status === 404 || err?.status === 0 || err?.name === 'AbortError') {
          setTileError(true);
          logger.warn('MapContainer: Tile load error', err);
        }
      });

      // Clear error indicator when tiles load successfully
      map.on('sourcedata', (e: maplibregl.SourceDataType) => {
        if (tileError && e.isSourceLoaded && e.source.type === 'raster' || e.source.type === 'vector') {
          setTileError(false);
        }
      });
    }
  }, [setMapReference, tileError]);

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

    const feature = features[0]!;
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
      bounds.extend([lng!, lat!]);
    });

    // Add street coordinates
    filteredStreets.forEach((street) => {
      const { type, coordinates } = street.geometry;

      if (type === 'LineString') {
        (coordinates as number[][]).forEach(([lng, lat]) => {
          bounds.extend([lng!, lat!]);
        });
      } else if (type === 'MultiLineString' || type === 'Polygon') {
        (coordinates as number[][][]).forEach((line) => {
          line.forEach(([lng, lat]) => {
            bounds.extend([lng!, lat!]);
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
      map.flyTo({
        center,
        zoom: 17,
        duration: 2000,
        essential: true
      });
    } else {
      // Multiple results: fitBounds
      map.fitBounds(bounds, {
        padding: 50,
        duration: 2000,
        essential: true,
        maxZoom: 17,
      });
    }
  }, [filteredBuildings, filteredStreets, searchRevision]);

  // Trigger search navigation when revision changes — useEffect to avoid side effects during render
  useEffect(() => {
    if (searchRevision !== 0 && searchRevision !== lastSearchRevisionRef.current) {
      handleSearchNavigation();
    }
  }, [searchRevision, handleSearchNavigation]);

  // FitBounds when showAllLayers is activated - using useRef to track previous state
  const prevShowAllLayersRef = useRef(showAllLayers);
  useEffect(() => {
    // Only trigger when showAllLayers changes from false to true
    if (showAllLayers && !prevShowAllLayersRef.current) {
      const map = mapRef.current?.getMap();
      if (map && filteredBuildings.length > 0) {
        logger.debug('MapContainer: FitBounds for Ver Todo');

        const bounds = new maplibregl.LngLatBounds();

        // Add all building coordinates
        filteredBuildings.forEach((building) => {
          const [lng, lat] = building.geometry.coordinates;
          bounds.extend([lng!, lat!]);
        });

        // Add street coordinates if any
        filteredStreets.forEach((street) => {
          const { type, coordinates } = street.geometry;
          if (type === 'LineString') {
            (coordinates as number[][]).forEach(([lng, lat]) => bounds.extend([lng!, lat!]));
          } else if (type === 'MultiLineString' || type === 'Polygon') {
            (coordinates as number[][][]).forEach((line) => {
              line.forEach(([lng, lat]) => bounds.extend([lng!, lat!]));
            });
          }
        });

        map.fitBounds(bounds, {
          padding: 50,
          duration: 2000,
          essential: true,
          maxZoom: 14, // Lower zoom to see all clusters
        });
      }
    }
    prevShowAllLayersRef.current = showAllLayers;
  }, [showAllLayers, filteredBuildings, filteredStreets]);

  // Prepare GeoJSON data — memoized to avoid recomputing on every render
  const buildingsGeoJSON = useMemo(
    () => buildingsToGeoJSON(filteredBuildings),
    [filteredBuildings]
  );
  const streetsGeoJSON = useMemo(
    () => streetsToGeoJSON(filteredStreets),
    [filteredStreets]
  );

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

  // Accuracy circle polygon — real coordinates that scale with zoom
  const accuracyCircleGeoJSON = useMemo(() => {
    if (!userPosition || !locationAccuracy) return null;
    return {
      type: 'FeatureCollection' as const,
      features: [createAccuracyCircle(userPosition, locationAccuracy)],
    };
  }, [userPosition, locationAccuracy]);

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
      interactiveLayerIds={['unclustered-point', 'street-lines', 'street-fills']}
    >
      {/* Hash sync */}
      <MapHashSync />

      {/* Style selector */}
      <StyleSelector
        currentStyle={mapStyle}
        onStyleChange={setMapStyle}
      />

      {/* Tile error indicator — shown when map tiles fail to load */}
      {tileError && (
        <div className="maplibregl-ctrl maplibregl-ctrl-group"
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            background: 'rgba(255,255,255,0.9)',
            borderRadius: 4,
            fontSize: 12,
            color: '#b45309',
            pointerEvents: 'none',
          }}
        >
          ⚠️ Sin conexión — mapa parcial
        </div>
      )}

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
        <>
          {/* Accuracy circle — polygon in real meters */}
          {accuracyCircleGeoJSON && (
            <Source id="user-accuracy" type="geojson" data={accuracyCircleGeoJSON}>
              <Layer
                id="user-location-accuracy"
                type="fill"
                paint={{
                  'fill-color': 'rgba(37, 99, 235, 0.15)',
                  'fill-outline-color': 'rgba(37, 99, 235, 0.3)',
                }}
              />
            </Source>
          )}
          {/* User dot */}
          <Source id="user-location" type="geojson" data={userLocationGeoJSON}>
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
        </>
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
          <MapPopupContent popupInfo={popupInfo} />
        </Popup>
      )}
    </Map>
  );
});

MapContainer.displayName = 'MapContainer';
