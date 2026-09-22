import { useCallback, useRef, useState, memo, useEffect } from "react";
import Map, {
  type MapRef,
  type ViewStateChangeEvent,
  type MapLayerMouseEvent,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { useMapContext } from "../../context/MapContext";
import { MapHashSync } from "./MapHashSync";
import { StyleSelector } from "./StyleSelector";
import { BuildingsLayer, StreetsLayer, UserLocationLayer } from "./mapLayers";
import { MapPopup } from "./MapPopup";
import { useMapNavigation } from "./useMapNavigation";
import { MAP_STYLES, DEFAULT_STYLE } from "../../constants/mapStyles";
import type { BuildingFeature, StreetFeature } from "../../types/geojson";
import type { LngLatArray, MapStyleId, PopupInfo } from "../../types/map";
import { logger } from "../../utils/logger";

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

export const MapContainer = memo(({
  filteredBuildings,
  filteredStreets,
  showAllLayers,
  userPosition,
  locationAccuracy,
  isLocationTracking,
  searchRevision,
  onMapClick,
}: MapContainerProps) => {
  const { mapState, setMapState, setMapReference } = useMapContext();
  const mapRef = useRef<MapRef>(null);
  const [mapStyle, setMapStyle] = useState<MapStyleId>(DEFAULT_STYLE);
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);
  // Last position the map actually flew to (null while not tracking).
  const lastFlownPositionRef = useRef<LngLatArray | null>(null);

  // FlyTo user position when location tracking starts, and re-fly only when
  // the position moves meaningfully away from the last flown point. This
  // covers the coarse-first seed being refined by the accurate watch, while
  // walking-speed updates stay under the threshold and do not re-fly.
  //
  // ~50 m expressed as a planar degree threshold: 0.0005° is ~55 m of
  // latitude everywhere and ~55 m of longitude at the equator (~46 m at the
  // app's ~-34° latitudes), so the effective radius stays in the ~45-55 m
  // band — a good-enough approximation that avoids haversine math.
  const REFLY_THRESHOLD_DEGREES = 0.0005;

  useEffect(() => {
    if (!userPosition || !isLocationTracking) {
      // Reset when tracking stops
      if (!isLocationTracking) {
        lastFlownPositionRef.current = null;
      }
      return;
    }

    const lastFlown = lastFlownPositionRef.current;
    if (lastFlown) {
      const dLng = Math.abs(userPosition[0] - lastFlown[0]);
      const dLat = Math.abs(userPosition[1] - lastFlown[1]);
      // Simple planar distance check; see the approximation note above.
      if (dLng < REFLY_THRESHOLD_DEGREES && dLat < REFLY_THRESHOLD_DEGREES) {
        return;
      }
    }

    const map = mapRef.current?.getMap();
    if (map) {
      logger.debug('MapContainer: Flying to user position', userPosition);
      map.flyTo({
        center: userPosition,
        zoom: 17,
        duration: 1500,
      });
      lastFlownPositionRef.current = userPosition;
    }
  }, [userPosition, isLocationTracking]);

  // Search results navigation + showAllLayers fitBounds (shared bounds builder)
  useMapNavigation({
    mapRef,
    filteredBuildings,
    filteredStreets,
    searchRevision,
    showAllLayers,
  });

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
  const handleMapClick = useCallback((evt: MapLayerMouseEvent) => {
    const features = evt.features;

    // No features clicked - empty area
    if (!features || features.length === 0) {
      logger.debug('MapContainer: Empty area clicked');
      setPopupInfo(null);
      onMapClick?.();
      return;
    }

    const feature = features[0];
    if (!feature) return;
    const layerId = feature.layer?.id;

    logger.debug('MapContainer: Feature clicked', { layerId, properties: feature.properties });

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

  // Data layers render on data presence only: "Ver Todo" (showAllLayers)
  // bypasses filtering upstream, so the full dataset already arrives in the
  // arrays; empty lists render nothing regardless of that flag.

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

      {/* Buildings layer (no clustering - colors by type) */}
      {filteredBuildings.length > 0 && (
        <BuildingsLayer buildings={filteredBuildings} />
      )}

      {/* Streets layer */}
      {filteredStreets.length > 0 && (
        <StreetsLayer streets={filteredStreets} />
      )}

      {/* User location */}
      <UserLocationLayer
        userPosition={userPosition}
        locationAccuracy={locationAccuracy}
        isLocationTracking={isLocationTracking}
      />

      {/* Popup */}
      {popupInfo && (
        <MapPopup popupInfo={popupInfo} onClose={() => setPopupInfo(null)} />
      )}
    </Map>
  );
});

MapContainer.displayName = 'MapContainer';
