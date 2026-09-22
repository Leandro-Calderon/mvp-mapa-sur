import { useCallback, useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import maplibregl from 'maplibre-gl';
import type { LngLatBounds } from 'maplibre-gl';
import type { MapRef } from 'react-map-gl/maplibre';
import type { BuildingFeature, StreetFeature } from '../../types/geojson';
import { logger } from '../../utils/logger';

// Build one LngLatBounds from all building and street result coordinates
const calculateResultsBounds = (
  buildings: BuildingFeature[],
  streets: StreetFeature[],
): LngLatBounds => {
  const bounds = new maplibregl.LngLatBounds();

  // Add building coordinates
  buildings.forEach((building) => {
    const [lng, lat] = building.geometry.coordinates;
    bounds.extend([lng, lat]);
  });

  // Add street coordinates
  streets.forEach((street) => {
    const { type, coordinates } = street.geometry;

    if (type === 'LineString') {
      (coordinates as number[][]).forEach(([lng, lat]) => {
        if (typeof lng === 'number' && typeof lat === 'number') {
          bounds.extend([lng, lat]);
        }
      });
    } else if (type === 'MultiLineString' || type === 'Polygon') {
      (coordinates as number[][][]).forEach((line) => {
        line.forEach(([lng, lat]) => {
          if (typeof lng === 'number' && typeof lat === 'number') {
            bounds.extend([lng, lat]);
          }
        });
      });
    }
  });

  return bounds;
};

interface UseMapNavigationParams {
  mapRef: MutableRefObject<MapRef | null>;
  filteredBuildings: BuildingFeature[];
  filteredStreets: StreetFeature[];
  searchRevision: number;
  showAllLayers: boolean;
}

// Owns both result navigations: search-revision fly/fit and the
// showAllLayers false->true fitBounds. Both share calculateResultsBounds.
export const useMapNavigation = ({
  mapRef,
  filteredBuildings,
  filteredStreets,
  searchRevision,
  showAllLayers,
}: UseMapNavigationParams): void => {
  const lastSearchRevisionRef = useRef(0);

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

    const bounds = calculateResultsBounds(filteredBuildings, filteredStreets);

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
  }, [filteredBuildings, filteredStreets, searchRevision, mapRef]);

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
        logger.debug('[MapContainer] FitBounds for Ver Todo - all buildings');

        const bounds = calculateResultsBounds(filteredBuildings, filteredStreets);

        map.fitBounds(bounds, {
          padding: 50,
          duration: 1500,
          maxZoom: 14, // Lower zoom to see all clusters
        });
      }
    }
    prevShowAllLayersRef.current = showAllLayers;
  }, [showAllLayers, filteredBuildings, filteredStreets, mapRef]);
};
