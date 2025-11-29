import type { BuildingFeature, StreetFeature } from '../types/geojson';
import type { DataService } from './DataService';
import { indexedDBService, type CacheEntry } from './IndexedDBService';
import { connectionService } from './ConnectionService';

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

class OfflineDataService implements DataService {
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

      // If we should use offline first and have cached data, return it
      if (shouldUseOfflineFirst && hasCachedData && !forceRefresh) {
        return {
          data: cachedEntry.data,
          fromCache: true,
          isStale: !isCacheFresh,
          lastUpdated: cachedEntry.timestamp
        };
      }

      // If we're online and either forcing refresh or cache is stale/missing, fetch from network
      if (isOnline && (forceRefresh || !hasCachedData || !isCacheFresh)) {
        try {
          const freshData = await this.fetchFromNetwork<T>(resourceUrl);

          // Save to cache
          await indexedDBService.saveData(
            cacheKey,
            freshData as BuildingFeature[] | StreetFeature[],
            '1.0.0', // You could make this dynamic based on response headers
            new Date().toISOString()
          );

          return {
            data: freshData,
            fromCache: false,
            isStale: false,
            lastUpdated: Date.now()
          };
        } catch (networkError) {
          console.warn(`Network request failed for ${cacheKey}:`, networkError);

          // If network fails and we have cached data, return it even if stale
          if (hasCachedData) {
            return {
              data: cachedEntry.data,
              fromCache: true,
              isStale: true,
              lastUpdated: cachedEntry.timestamp
            };
          }

          throw networkError;
        }
      }

      // If we're offline or prefer offline and have cached data, return it
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
      console.error(`Error in fetchWithCache for ${cacheKey}:`, error);
      throw error;
    }
  }

  private async fetchFromNetwork<T extends BuildingFeature[] | StreetFeature[]>(resourceUrl: string): Promise<T> {
    const response = await fetch(resourceUrl, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${resourceUrl}: ${response.status} ${response.statusText}`);
    }

    const geojson = await response.json();

    // Handle both direct arrays and GeoJSON FeatureCollection format
    if (Array.isArray(geojson)) {
      return geojson as T;
    } else if (geojson.features && Array.isArray(geojson.features)) {
      return geojson.features as T;
    } else {
      throw new Error(`Invalid data format from ${resourceUrl}`);
    }
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
      console.log(`Buildings loaded from: ${result.fromCache ? 'cache' : 'network'}${result.isStale ? ' (stale)' : ''}`);

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
      console.log(`Streets loaded from: ${result.fromCache ? 'cache' : 'network'}${result.isStale ? ' (stale)' : ''}`);

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