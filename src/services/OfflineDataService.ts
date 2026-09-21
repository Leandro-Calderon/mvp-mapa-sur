import type { BuildingFeature, StreetFeature } from '../types/geojson';
import type { DataService } from './DataService';
import { indexedDBService, type CacheEntry } from './IndexedDBService';
import { connectionService } from './ConnectionService';
import { logger } from '../utils/logger';

export interface OfflineDataOptions {
  maxCacheAge?: number; // in milliseconds, default 24 hours
  forceRefresh?: boolean;
  preferOffline?: boolean;
}

export interface OfflineDataServiceResult<T> {
  data: T;
  fromCache: boolean;
  isStale: boolean;
  lastUpdated?: number;
}

// Result of a (possibly conditional) network fetch: either the server
// confirmed the cached copy is current (304 Not Modified), or it returned
// a fresh payload together with its ETag.
type NetworkFetchResult<T> =
  | { notModified: true; etag?: string }
  | { notModified: false; data: T; etag?: string };

export class OfflineDataService implements DataService {
  private readonly buildingsPath = 'assets/fonavi.geojson';
  private readonly streetsPath = 'assets/calles.geojson';
  private readonly BUILDINGS_CACHE_KEY = 'buildings';
  private readonly STREETS_CACHE_KEY = 'streets';
  private readonly DEFAULT_MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 hours

  private buildResourceUrl(assetPath: string): string {
    const baseUrl = import.meta.env.DEV ? '' : import.meta.env.BASE_URL;
    return `${baseUrl}${assetPath}`;
  }

  private async fetchWithCache<T extends BuildingFeature[] | StreetFeature[]>(
    cacheKey: string,
    resourceUrl: string,
    options: OfflineDataOptions = {}
  ): Promise<OfflineDataServiceResult<T>> {
    const {
      maxCacheAge = this.DEFAULT_MAX_CACHE_AGE,
      forceRefresh = false,
      preferOffline = false
    } = options;

    const isOnline = connectionService.isOnline();
    const shouldUseOfflineFirst = preferOffline || connectionService.shouldUseOfflineFirst();

    try {
      // Try to get cached data first
      const cachedEntry = await indexedDBService.getData<T>(cacheKey) as CacheEntry<T>;
      const hasCachedData = cachedEntry !== null;
      const isCacheFresh = hasCachedData &&
        (Date.now() - cachedEntry.timestamp) < maxCacheAge;

      // Offline-first (slow network or preferOffline) with cached data:
      // serve the cache immediately; staleness is reported by age only
      if (shouldUseOfflineFirst && hasCachedData && !forceRefresh) {
        return {
          data: cachedEntry.data,
          fromCache: true,
          isStale: !isCacheFresh,
          lastUpdated: cachedEntry.timestamp
        };
      }

      // Online with forced refresh or no cached data: plain network fetch.
      // Store the real ETag from the response so later revalidations can
      // send If-None-Match
      if (isOnline && (forceRefresh || !hasCachedData)) {
        try {
          const response = await this.fetchFromNetwork<T>(resourceUrl);

          // No conditional request was sent, so a 304 would be a protocol
          // violation; treat it like any other unexpected status
          if (response.notModified) {
            throw new Error(`Unexpected 304 response without If-None-Match for ${resourceUrl}`);
          }

          // Save to cache
          await indexedDBService.saveData(cacheKey, response.data, '1.0.0', response.etag);

          return {
            data: response.data,
            fromCache: false,
            isStale: false,
            lastUpdated: Date.now()
          };
        } catch (networkError) {
          logger.warn(`Network request failed for ${cacheKey}`, networkError);

          // If network fails and we have cached data, return it;
          // staleness is determined by age, not by the failure itself
          if (hasCachedData) {
            return {
              data: cachedEntry.data,
              fromCache: true,
              isStale: !isCacheFresh,
              lastUpdated: cachedEntry.timestamp
            };
          }

          throw networkError;
        }
      }

      // Online with cached data (no forceRefresh): revalidate with a
      // conditional request. The freshness TTL no longer gates network
      // contact; a 304 confirms the cache is current at zero payload cost
      if (isOnline && hasCachedData && !forceRefresh) {
        try {
          const response = await this.fetchFromNetwork<T>(resourceUrl, cachedEntry.etag);

          if (response.notModified) {
            // Cache confirmed current: re-save the entry (same data) to bump
            // its timestamp, keeping or renewing the stored ETag
            await indexedDBService.saveData(
              cacheKey,
              cachedEntry.data,
              cachedEntry.version,
              response.etag ?? cachedEntry.etag
            );

            return {
              data: cachedEntry.data,
              fromCache: true,
              isStale: false,
              lastUpdated: Date.now()
            };
          }

          await indexedDBService.saveData(
            cacheKey,
            response.data,
            cachedEntry.version,
            response.etag
          );

          return {
            data: response.data,
            fromCache: false,
            isStale: false,
            lastUpdated: Date.now()
          };
        } catch (networkError) {
          logger.warn(`Revalidation request failed for ${cacheKey}`, networkError);

          // Revalidation failed: fall back to the cache, stale only by age
          return {
            data: cachedEntry.data,
            fromCache: true,
            isStale: !isCacheFresh,
            lastUpdated: cachedEntry.timestamp
          };
        }
      }

      // Remaining fall-through with cached data (reachable when forceRefresh
      // is requested while offline): serve the cache, stale by age
      if (hasCachedData) {
        return {
          data: cachedEntry.data,
          fromCache: true,
          isStale: !isCacheFresh,
          lastUpdated: cachedEntry.timestamp
        };
      }

      // No cached data and offline
      throw new Error(`No cached data available for ${cacheKey} and device is offline`);

    } catch (error) {
      logger.error(`Error in fetchWithCache for ${cacheKey}`, error);
      throw error;
    }
  }

  private async fetchFromNetwork<T extends BuildingFeature[] | StreetFeature[]>(
    resourceUrl: string,
    etag?: string
  ): Promise<NetworkFetchResult<T>> {
    const headers: Record<string, string> = {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };

    // Conditional request: only revalidate when we hold an ETag
    if (etag) {
      headers['If-None-Match'] = etag;
    }

    const response = await fetch(resourceUrl, { headers });

    if (response.status === 304) {
      return { notModified: true, etag: response.headers.get('etag') ?? undefined };
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch ${resourceUrl}: ${response.status} ${response.statusText}`);
    }

    const geojson: unknown = await response.json();
    return {
      notModified: false,
      data: this.parseGeojsonResponse<T>(geojson, resourceUrl),
      etag: response.headers.get('etag') ?? undefined
    };
  }

  // Handle both direct arrays and GeoJSON FeatureCollection format
  private parseGeojsonResponse<T extends BuildingFeature[] | StreetFeature[]>(
    geojson: unknown,
    resourceUrl: string
  ): T {
    if (Array.isArray(geojson)) {
      return geojson as T;
    }

    if (
      typeof geojson === 'object' && geojson !== null &&
      Array.isArray((geojson as { features?: unknown }).features)
    ) {
      return (geojson as { features: T }).features;
    }

    throw new Error(`Invalid data format from ${resourceUrl}`);
  }

  async loadBuildings(options: OfflineDataOptions = {}): Promise<BuildingFeature[]> {
    try {
      const resourceUrl = this.buildResourceUrl(this.buildingsPath);
      const result = await this.fetchWithCache<BuildingFeature[]>(
        this.BUILDINGS_CACHE_KEY,
        resourceUrl,
        options
      );

      // Log the source for debugging
      logger.debug(`Buildings loaded from: ${result.fromCache ? 'cache' : 'network'}${result.isStale ? ' (stale)' : ''}`);

      return result.data;
    } catch (error) {
      throw new Error(`Failed to load buildings data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async loadStreets(options: OfflineDataOptions = {}): Promise<StreetFeature[]> {
    try {
      const resourceUrl = this.buildResourceUrl(this.streetsPath);
      const result = await this.fetchWithCache<StreetFeature[]>(
        this.STREETS_CACHE_KEY,
        resourceUrl,
        options
      );

      // Log the source for debugging
      logger.debug(`Streets loaded from: ${result.fromCache ? 'cache' : 'network'}${result.isStale ? ' (stale)' : ''}`);

      return result.data;
    } catch (error) {
      throw new Error(`Failed to load streets data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Enhanced methods with metadata
  async loadBuildingsWithMetadata(options: OfflineDataOptions = {}): Promise<OfflineDataServiceResult<BuildingFeature[]>> {
    try {
      const resourceUrl = this.buildResourceUrl(this.buildingsPath);
      return await this.fetchWithCache<BuildingFeature[]>(
        this.BUILDINGS_CACHE_KEY,
        resourceUrl,
        options
      );
    } catch (error) {
      throw new Error(`Failed to load buildings data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async loadStreetsWithMetadata(options: OfflineDataOptions = {}): Promise<OfflineDataServiceResult<StreetFeature[]>> {
    try {
      const resourceUrl = this.buildResourceUrl(this.streetsPath);
      return await this.fetchWithCache<StreetFeature[]>(
        this.STREETS_CACHE_KEY,
        resourceUrl,
        options
      );
    } catch (error) {
      throw new Error(`Failed to load streets data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Cache management methods
  async clearCache(): Promise<void> {
    await indexedDBService.clearCache();
  }

  async getCacheInfo(): Promise<{
    buildings: CacheEntry<BuildingFeature[]> | null;
    streets: CacheEntry<StreetFeature[]> | null;
    totalSize: number;
  }> {
    const [buildings, streets, totalSize] = await Promise.all([
      indexedDBService.getData<BuildingFeature[]>(this.BUILDINGS_CACHE_KEY),
      indexedDBService.getData<StreetFeature[]>(this.STREETS_CACHE_KEY),
      indexedDBService.getCacheSize()
    ]);

    return {
      buildings,
      streets,
      totalSize
    };
  }

  async refreshCache(): Promise<void> {
    const refreshOptions: OfflineDataOptions = {
      forceRefresh: true,
      maxCacheAge: 0 // Force refresh regardless of age
    };

    await Promise.all([
      this.loadBuildings(refreshOptions),
      this.loadStreets(refreshOptions)
    ]);
  }

  // Check if data is available offline
  async isDataAvailableOffline(): Promise<{
    buildings: boolean;
    streets: boolean;
  }> {
    const [buildingsFresh, streetsFresh] = await Promise.all([
      indexedDBService.isDataFresh(this.BUILDINGS_CACHE_KEY),
      indexedDBService.isDataFresh(this.STREETS_CACHE_KEY)
    ]);

    return {
      buildings: buildingsFresh,
      streets: streetsFresh
    };
  }
}

// Factory function to create the appropriate service based on context
export const createDataService = (): DataService => {
  return new OfflineDataService();
};

// Export the enhanced service for direct use