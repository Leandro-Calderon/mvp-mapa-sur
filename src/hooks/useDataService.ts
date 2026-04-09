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

// ─── Module-level load deduplication ────────────────────────────────────────
// When multiple hook instances call loadData() concurrently (e.g. MapView +
// useBuildingsData + useStreetsData all mounting at the same time), we
// deduplicate the actual data fetch so it only happens once.

type DataKey = 'buildings' | 'streets';

interface CachedLoadResult {
  data: BuildingFeature[] | StreetFeature[];
  fromCache: boolean;
  isStale: boolean;
  lastUpdated?: number;
}

// In-flight load promises keyed by data type
const inflightLoads = new Map<DataKey, Promise<CachedLoadResult>>();

// Cached results — used to hydrate late-mounting hooks instantly
const cachedResults = new Map<DataKey, CachedLoadResult>();

// Subscribers notified when a load completes (so late hooks get updated)
const subscribers = new Map<DataKey, Set<(result: CachedLoadResult) => void>>();

function subscribeTo(key: DataKey, cb: (result: CachedLoadResult) => void): () => void {
  if (!subscribers.has(key)) subscribers.set(key, new Set());
  subscribers.get(key)!.add(cb);
  return () => { subscribers.get(key)?.delete(cb); };
}

function notifyAll(key: DataKey, result: CachedLoadResult): void {
  cachedResults.set(key, result);
  subscribers.get(key)?.forEach(cb => cb(result));
}

/**
 * Deduplicated data loader. Only the FIRST call actually fetches;
 * concurrent calls piggyback on the same promise. Completed results
 * are cached for instant hydration of late-mounting hooks.
 */
async function dedupLoad(
  key: DataKey,
  loader: () => Promise<OfflineDataServiceResult<BuildingFeature[] | StreetFeature[]>>,
  forceRefresh: boolean,
): Promise<CachedLoadResult> {
  // On force refresh, clear cached result so we fetch fresh
  if (forceRefresh) {
    cachedResults.delete(key);
  }

  // Return cached result immediately if available
  if (cachedResults.has(key)) {
    return cachedResults.get(key)!;
  }

  // Piggyback on in-flight load if one exists
  if (inflightLoads.has(key)) {
    return inflightLoads.get(key)!;
  }

  // Start a new load
  const promise = loader().then((result): CachedLoadResult => ({
    data: result.data,
    fromCache: result.fromCache,
    isStale: result.isStale,
    lastUpdated: result.lastUpdated,
  }));

  inflightLoads.set(key, promise);

  try {
    const loadResult = await promise;
    notifyAll(key, loadResult);
    return loadResult;
  } catch (error) {
    // Remove cache so next attempt retries
    cachedResults.delete(key);
    throw error;
  } finally {
    inflightLoads.delete(key);
  }
}

function clearAllCache(): void {
  cachedResults.delete('buildings');
  cachedResults.delete('streets');
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
    if (forceRefresh) {
      clearAllCache();
    }

    const isOnline = connectionService.isOnline();
    const preferOffline = connectionService.shouldUseOfflineFirst();
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

    // Load buildings and streets in parallel — deduplicated at module level
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

  // Subscribe to module-level deduplicated results
  // This allows late-mounting hooks to get data that was already loaded
  useEffect(() => {
    // Check if we already have cached results to hydrate immediately
    const buildingsCached = cachedResults.get('buildings');
    const streetsCached = cachedResults.get('streets');

    if (buildingsCached) {
      setBuildingsResult({
        data: buildingsCached.data as BuildingFeature[],
        loading: false,
        error: null,
        fromCache: buildingsCached.fromCache,
        isStale: buildingsCached.isStale,
        lastUpdated: buildingsCached.lastUpdated,
      });
    }

    if (streetsCached) {
      setStreetsResult({
        data: streetsCached.data as StreetFeature[],
        loading: false,
        error: null,
        fromCache: streetsCached.fromCache,
        isStale: streetsCached.isStale,
        lastUpdated: streetsCached.lastUpdated,
      });
    }

    // Subscribe to future updates from other hook instances
    const unsubBuildings = subscribeTo('buildings', (result) => {
      setBuildingsResult({
        data: result.data as BuildingFeature[],
        loading: false,
        error: null,
        fromCache: result.fromCache,
        isStale: result.isStale,
        lastUpdated: result.lastUpdated,
      });
    });

    const unsubStreets = subscribeTo('streets', (result) => {
      setStreetsResult({
        data: result.data as StreetFeature[],
        loading: false,
        error: null,
        fromCache: result.fromCache,
        isStale: result.isStale,
        lastUpdated: result.lastUpdated,
      });
    });

    return () => {
      unsubBuildings();
      unsubStreets();
    };
  }, []);

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

