import { useEffect, useState, useCallback } from 'react';
import type { DataService, DataServiceResult } from '../services/DataService';
import type { BuildingFeature, StreetFeature } from '../types/geojson';
import type { OfflineDataServiceResult } from '../services/OfflineDataService';
import { connectionService } from '../services/ConnectionService';

export interface EnhancedDataServiceResult<T> extends DataServiceResult<T> {
  fromCache: boolean;
  isStale: boolean;
  lastUpdated?: number;
}

export const useDataService = (service: DataService) => {
  const [buildingsResult, setBuildingsResult] = useState<EnhancedDataServiceResult<BuildingFeature[]>>({
    data: [],
    loading: true,
    error: null,
    fromCache: false,
    isStale: false
  });

  const [streetsResult, setStreetsResult] = useState<EnhancedDataServiceResult<StreetFeature[]>>({
    data: [],
    loading: true,
    error: null,
    fromCache: false,
    isStale: false
  });

  const loadData = useCallback(async (forceRefresh = false) => {
    const isOnline = connectionService.isOnline();
    const preferOffline = connectionService.shouldUseOfflineFirst();

    // Load buildings
    try {
      setBuildingsResult(prev => ({
        ...prev,
        loading: true,
        error: null
      }));

      // Check if we have enhanced service (OfflineDataService)
      const isOfflineService = 'loadBuildingsWithMetadata' in service;

      let buildings: BuildingFeature[];
      let buildingsMetadata: OfflineDataServiceResult<BuildingFeature[]> | null = null;

      if (isOfflineService) {
        buildingsMetadata = await (service as any).loadBuildingsWithMetadata({
          forceRefresh,
          preferOffline: preferOffline && !forceRefresh
        }) as OfflineDataServiceResult<BuildingFeature[]>;
        buildings = buildingsMetadata.data;
      } else {
        buildings = await service.loadBuildings();
      }

      if (buildingsMetadata) {
        if (isOnline && buildingsMetadata.isStale && !forceRefresh) {
          // Data is stale but we're online, try to refresh in background
          setBuildingsResult({
            data: buildingsMetadata.data,
            loading: false,
            error: null,
            fromCache: buildingsMetadata.fromCache,
            isStale: buildingsMetadata.isStale,
            lastUpdated: buildingsMetadata.lastUpdated
          });

          // Trigger background refresh
          setTimeout(() => loadData(true), 1000);
        } else {
          setBuildingsResult({
            data: buildingsMetadata.data,
            loading: false,
            error: null,
            fromCache: buildingsMetadata.fromCache,
            isStale: buildingsMetadata.isStale,
            lastUpdated: buildingsMetadata.lastUpdated
          });
        }
      } else {
        // Fallback for regular DataService
        setBuildingsResult({
          data: buildings,
          loading: false,
          error: null,
          fromCache: false,
          isStale: false
        });
      }
    } catch (error) {
      setBuildingsResult({
        data: [],
        loading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
        fromCache: false,
        isStale: false
      });
    }

    // Load streets
    try {
      setStreetsResult(prev => ({
        ...prev,
        loading: true,
        error: null
      }));

      // Check if we have enhanced service (OfflineDataService)
      const isOfflineService = 'loadStreetsWithMetadata' in service;

      let streets: StreetFeature[];
      let streetsMetadata: OfflineDataServiceResult<StreetFeature[]> | null = null;

      if (isOfflineService) {
        streetsMetadata = await (service as any).loadStreetsWithMetadata({
          forceRefresh,
          preferOffline: preferOffline && !forceRefresh
        }) as OfflineDataServiceResult<StreetFeature[]>;
        streets = streetsMetadata.data;
      } else {
        streets = await service.loadStreets();
      }

      if (streetsMetadata) {
        if (isOnline && streetsMetadata.isStale && !forceRefresh) {
          // Data is stale but we're online, try to refresh in background
          setStreetsResult({
            data: streetsMetadata.data,
            loading: false,
            error: null,
            fromCache: streetsMetadata.fromCache,
            isStale: streetsMetadata.isStale,
            lastUpdated: streetsMetadata.lastUpdated
          });

          // Trigger background refresh
          setTimeout(() => loadData(true), 1000);
        } else {
          setStreetsResult({
            data: streetsMetadata.data,
            loading: false,
            error: null,
            fromCache: streetsMetadata.fromCache,
            isStale: streetsMetadata.isStale,
            lastUpdated: streetsMetadata.lastUpdated
          });
        }
      } else {
        // Fallback for regular DataService
        setStreetsResult({
          data: streets,
          loading: false,
          error: null,
          fromCache: false,
          isStale: false
        });
      }
    } catch (error) {
      setStreetsResult({
        data: [],
        loading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
        fromCache: false,
        isStale: false
      });
    }
  }, [service]);

  useEffect(() => {
    let isMounted = true;

    const initialLoad = async () => {
      await loadData();
    };

    if (isMounted) {
      initialLoad();
    }

    return () => {
      isMounted = false;
    };
  }, [loadData]);

  // Listen for connection changes
  useEffect(() => {
    const unsubscribe = connectionService.addListener(async (status) => {
      if (status.isOnline) {
        // Came back online, refresh data
        await loadData(true);
      }
    });

    return unsubscribe;
  }, [loadData]);

  const refresh = useCallback(() => {
    loadData(true);
  }, [loadData]);

  return {
    buildings: buildingsResult,
    streets: streetsResult,
    refresh,
    isOnline: connectionService.isOnline(),
    networkQuality: connectionService.getNetworkQuality()
  };
};
