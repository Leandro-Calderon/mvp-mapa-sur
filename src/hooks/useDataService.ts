import { useEffect, useState, useCallback, useRef } from 'react';
import type { DataService, DataServiceResult } from '../services/DataService';
import type { BuildingFeature, StreetFeature } from '../types/geojson';
import type { OfflineDataServiceResult } from '../services/OfflineDataService';
import { connectionService } from '../services/ConnectionService';

export interface EnhancedDataServiceResult<T> extends DataServiceResult<T> {
  fromCache: boolean;
  isStale: boolean;
  lastUpdated?: number;
}

// Helper to schedule background refresh with requestIdleCallback
const scheduleBackgroundRefresh = (callback: () => void) => {
  if ('requestIdleCallback' in window) {
    (window as Window).requestIdleCallback(() => callback(), { timeout: 2000 });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(callback, 1000);
  }
};

// Default initial state for data results
const createInitialState = <T>(): EnhancedDataServiceResult<T[]> => ({
  data: [] as T[],
  loading: true,
  error: null,
  fromCache: false,
  isStale: false
});

// Generic data loader configuration
interface DataLoaderConfig<T> {
  loadWithMetadata: (options: { forceRefresh: boolean; preferOffline: boolean }) => Promise<OfflineDataServiceResult<T[]>>;
  loadBasic: () => Promise<T[]>;
  hasMetadata: boolean;
}

// Generic function to load data with either metadata or basic service
async function loadDataType<T>(
  config: DataLoaderConfig<T>,
  forceRefresh: boolean,
  preferOffline: boolean,
  isOnline: boolean,
  setResult: React.Dispatch<React.SetStateAction<EnhancedDataServiceResult<T[]>>>,
  onStaleData?: () => void
): Promise<void> {
  try {
    setResult(prev => ({
      ...prev,
      loading: true,
      error: null
    }));

    if (config.hasMetadata) {
      const metadata = await config.loadWithMetadata({
        forceRefresh,
        preferOffline: preferOffline && !forceRefresh
      });

      setResult({
        data: metadata.data,
        loading: false,
        error: null,
        fromCache: metadata.fromCache,
        isStale: metadata.isStale,
        lastUpdated: metadata.lastUpdated
      });

      // If data is stale and we're online, trigger background refresh
      if (isOnline && metadata.isStale && !forceRefresh && onStaleData) {
        scheduleBackgroundRefresh(onStaleData);
      }
    } else {
      const data = await config.loadBasic();
      setResult({
        data,
        loading: false,
        error: null,
        fromCache: false,
        isStale: false
      });
    }
  } catch (error) {
    setResult({
      data: [],
      loading: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
      fromCache: false,
      isStale: false
    });
  }
}

export const useDataService = (service: DataService) => {
  const [buildingsResult, setBuildingsResult] = useState<EnhancedDataServiceResult<BuildingFeature[]>>(
    createInitialState<BuildingFeature>()
  );

  const [streetsResult, setStreetsResult] = useState<EnhancedDataServiceResult<StreetFeature[]>>(
    createInitialState<StreetFeature>()
  );

  // Track if a refresh is already scheduled to prevent multiple concurrent refreshes
  const refreshScheduledRef = useRef(false);

  const loadData = useCallback(async (forceRefresh = false) => {
    const isOnline = connectionService.isOnline();
    const preferOffline = connectionService.shouldUseOfflineFirst();

    // Check service capabilities once
    const hasBuildingsMetadata = 'loadBuildingsWithMetadata' in service;
    const hasStreetsMetadata = 'loadStreetsWithMetadata' in service;

    // Create a refresh callback that prevents multiple concurrent refreshes
    const triggerRefresh = () => {
      if (!refreshScheduledRef.current) {
        refreshScheduledRef.current = true;
        loadData(true).finally(() => {
          refreshScheduledRef.current = false;
        });
      }
    };

    // Load buildings and streets in parallel
    await Promise.all([
      loadDataType<BuildingFeature>(
        {
          loadWithMetadata: (opts) => (service as any).loadBuildingsWithMetadata(opts),
          loadBasic: () => service.loadBuildings(),
          hasMetadata: hasBuildingsMetadata
        },
        forceRefresh,
        preferOffline,
        isOnline,
        setBuildingsResult,
        triggerRefresh
      ),
      loadDataType<StreetFeature>(
        {
          loadWithMetadata: (opts) => (service as any).loadStreetsWithMetadata(opts),
          loadBasic: () => service.loadStreets(),
          hasMetadata: hasStreetsMetadata
        },
        forceRefresh,
        preferOffline,
        isOnline,
        setStreetsResult,
        triggerRefresh
      )
    ]);
  }, [service]);

  useEffect(() => {
    let isMounted = true;

    const initialLoad = async () => {
      if (isMounted) {
        await loadData();
      }
    };

    initialLoad();

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

