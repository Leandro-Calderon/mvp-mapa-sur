import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OfflineDataService } from './OfflineDataService';
import type { CacheEntry } from './IndexedDBService';
import type { BuildingFeature, StreetFeature } from '../types/geojson';

type CacheEntryLike = CacheEntry<BuildingFeature[]> | CacheEntry<StreetFeature[]>;

const {
    mockGetData,
    mockSaveData,
    mockClearCache,
    mockGetCacheSize,
    mockIsDataFresh,
    mockIsOnline,
    mockShouldUseOfflineFirst,
    mockAddListener
} = vi.hoisted(() => ({
    mockGetData: vi.fn<(id: string) => Promise<CacheEntryLike | null>>(),
    mockSaveData: vi.fn<(id: string, data: BuildingFeature[] | StreetFeature[], version: string, etag?: string) => Promise<void>>(),
    mockClearCache: vi.fn<() => Promise<void>>(),
    mockGetCacheSize: vi.fn<() => Promise<number>>(),
    mockIsDataFresh: vi.fn<(id: string, maxAgeMs?: number) => Promise<boolean>>(),
    mockIsOnline: vi.fn<() => boolean>(),
    mockShouldUseOfflineFirst: vi.fn<() => boolean>(),
    mockAddListener: vi.fn<(listener: (status: { isOnline: boolean }) => void) => () => void>()
}));

vi.mock('./IndexedDBService', () => ({
    indexedDBService: {
        getData: mockGetData,
        saveData: mockSaveData,
        clearCache: mockClearCache,
        getCacheSize: mockGetCacheSize,
        isDataFresh: mockIsDataFresh
    }
}));

vi.mock('./ConnectionService', () => ({
    connectionService: {
        isOnline: mockIsOnline,
        shouldUseOfflineFirst: mockShouldUseOfflineFirst,
        addListener: mockAddListener
    }
}));

vi.mock('../utils/logger', () => ({
    logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    }
}));

const buildingFeature: BuildingFeature = {
    type: 'Feature',
    properties: { tipo: 'Edificio', nombre: 12, plan: '2021', id: 12 },
    geometry: { type: 'Point', coordinates: [-60.66904, -32.93968] }
};

const streetFeature: StreetFeature = {
    type: 'Feature',
    properties: { nombre: 'Calle Test', tipo: 'Calle' },
    geometry: { type: 'LineString', coordinates: [[-60.669, -32.939], [-60.67, -32.94]] }
};

const HOUR_MS = 60 * 60 * 1000;

const freshBuildingsEntry = (): CacheEntry<BuildingFeature[]> => ({
    id: 'buildings',
    data: [buildingFeature],
    timestamp: Date.now(),
    version: '1.0.0'
});

const staleBuildingsEntry = (): CacheEntry<BuildingFeature[]> => ({
    id: 'buildings',
    data: [buildingFeature],
    timestamp: Date.now() - 25 * HOUR_MS, // older than the default 24h max age
    version: '1.0.0'
});

// Minimal Response double: the service only reads ok/status/statusText/json.
const okResponse = <T>(payload: T): Response =>
    ({ ok: true, status: 200, statusText: 'OK', json: async () => payload }) as unknown as Response;

const errorResponse = (status: number, statusText: string): Response =>
    ({ ok: false, status, statusText, json: async () => ({}) }) as unknown as Response;

const featureCollection = (features: unknown[]): { type: 'FeatureCollection'; features: unknown[] } => ({
    type: 'FeatureCollection',
    features
});

describe('OfflineDataService', () => {
    let service: OfflineDataService;
    // Stubbed global fetch; in vitest import.meta.env.DEV is true, so the
    // service builds URLs like 'assets/fonavi.geojson' (no base path).
    // The service calls fetch(url, { headers: { 'Cache-Control', 'Pragma' } }).
    const fetchMock = vi.fn<(input: string, init?: { headers?: Record<string, string> }) => Promise<Response>>();

    beforeEach(() => {
        vi.clearAllMocks();
        service = new OfflineDataService();

        mockIsOnline.mockReturnValue(true);
        mockShouldUseOfflineFirst.mockReturnValue(false);
        mockGetData.mockResolvedValue(null);

        fetchMock.mockReset();
        fetchMock.mockResolvedValue(okResponse(featureCollection([buildingFeature])));
        vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('fetchWithCache decision tree (via loadBuildingsWithMetadata)', () => {
        it('should return fresh cached data without fetching when offline-first is preferred', async () => {
            mockShouldUseOfflineFirst.mockReturnValue(true);
            const entry = freshBuildingsEntry();
            mockGetData.mockResolvedValue(entry);

            const result = await service.loadBuildingsWithMetadata();

            expect(result).toEqual({
                data: [buildingFeature],
                fromCache: true,
                isStale: false,
                lastUpdated: entry.timestamp
            });
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('should return stale cached data flagged as stale when offline-first is preferred', async () => {
            mockShouldUseOfflineFirst.mockReturnValue(true);
            const entry = staleBuildingsEntry();
            mockGetData.mockResolvedValue(entry);

            const result = await service.loadBuildingsWithMetadata();

            expect(result).toEqual({
                data: [buildingFeature],
                fromCache: true,
                isStale: true,
                lastUpdated: entry.timestamp
            });
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('should fetch from network when online with no cache and save version 1.0.0', async () => {
            mockGetData.mockResolvedValue(null);
            const before = Date.now();

            const result = await service.loadBuildingsWithMetadata();

            const after = Date.now();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(fetchMock.mock.calls[0]?.[0]).toBe('assets/fonavi.geojson');
            expect(mockSaveData).toHaveBeenCalledTimes(1);
            expect(mockSaveData).toHaveBeenCalledWith('buildings', [buildingFeature], '1.0.0', expect.any(String));
            expect(result.data).toEqual([buildingFeature]);
            expect(result.fromCache).toBe(false);
            expect(result.isStale).toBe(false);
            expect(result.lastUpdated).toBeGreaterThanOrEqual(before);
            expect(result.lastUpdated).toBeLessThanOrEqual(after);
        });

        it('should serve a FRESH cache without network revalidation when online and not offline-first', async () => {
            // Actual behavior: the network branch is skipped because the cache
            // is fresh, and execution falls through to the cache-return branch.
            // Online users get fresh cache served without any revalidation.
            mockShouldUseOfflineFirst.mockReturnValue(false);
            mockIsOnline.mockReturnValue(true);
            const entry = freshBuildingsEntry();
            mockGetData.mockResolvedValue(entry);

            const result = await service.loadBuildingsWithMetadata();

            expect(fetchMock).not.toHaveBeenCalled();
            expect(result.fromCache).toBe(true);
            expect(result.isStale).toBe(false);
            expect(result.lastUpdated).toBe(entry.timestamp);
        });

        it('should refresh from network when online with a stale cache', async () => {
            mockGetData.mockResolvedValue(staleBuildingsEntry());

            const result = await service.loadBuildingsWithMetadata();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(result.fromCache).toBe(false);
            expect(result.isStale).toBe(false);
            expect(mockSaveData).toHaveBeenCalledWith('buildings', [buildingFeature], '1.0.0', expect.any(String));
        });

        it('should ignore a cached copy when forceRefresh is set even with offline-first', async () => {
            mockShouldUseOfflineFirst.mockReturnValue(true);
            mockGetData.mockResolvedValue(freshBuildingsEntry());

            const result = await service.loadBuildingsWithMetadata({ forceRefresh: true });

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(result.fromCache).toBe(false);
            expect(result.data).toEqual([buildingFeature]);
        });

        it('should fall back to stale cache when the network fails while online', async () => {
            // A stale cache makes the code enter the network branch; the failed
            // fetch then serves the stale cached copy as a fallback.
            const entry = staleBuildingsEntry();
            mockGetData.mockResolvedValue(entry);
            fetchMock.mockRejectedValue(new Error('Network unavailable'));

            const result = await service.loadBuildingsWithMetadata();

            expect(result.fromCache).toBe(true);
            expect(result.isStale).toBe(true);
            expect(result.data).toEqual([buildingFeature]);
            expect(result.lastUpdated).toBe(entry.timestamp);
        });

        it('should report a fresh cache as stale when a forced refresh fails while online', async () => {
            // Actual behavior: after a failed forceRefresh the (fresh) cache is
            // served but hard-coded as isStale: true in the catch block.
            const entry = freshBuildingsEntry();
            mockGetData.mockResolvedValue(entry);
            fetchMock.mockRejectedValue(new Error('Network unavailable'));

            const result = await service.loadBuildingsWithMetadata({ forceRefresh: true });

            expect(result.fromCache).toBe(true);
            expect(result.isStale).toBe(true);
            expect(result.data).toEqual([buildingFeature]);
        });

        it('should reject with the loadBuildings prefix when the network fails and no cache exists', async () => {
            mockGetData.mockResolvedValue(null);
            fetchMock.mockRejectedValue(new Error('Network down'));

            await expect(service.loadBuildingsWithMetadata()).rejects.toThrow('Failed to load buildings data: Network down');
        });

        it('should return stale cached data without fetching when offline', async () => {
            mockIsOnline.mockReturnValue(false);
            mockShouldUseOfflineFirst.mockReturnValue(false);
            const entry = staleBuildingsEntry();
            mockGetData.mockResolvedValue(entry);

            const result = await service.loadBuildingsWithMetadata();

            expect(fetchMock).not.toHaveBeenCalled();
            expect(result.fromCache).toBe(true);
            expect(result.isStale).toBe(true);
            expect(result.lastUpdated).toBe(entry.timestamp);
        });

        it('should reject when offline with no cached data', async () => {
            mockIsOnline.mockReturnValue(false);
            mockShouldUseOfflineFirst.mockReturnValue(false);
            mockGetData.mockResolvedValue(null);

            await expect(service.loadBuildingsWithMetadata()).rejects.toThrow(
                'Failed to load buildings data: No cached data available for buildings and device is offline'
            );
        });
    });

    describe('fetchFromNetwork response parsing', () => {
        it('should unwrap a GeoJSON FeatureCollection to its features array', async () => {
            fetchMock.mockResolvedValueOnce(okResponse(featureCollection([buildingFeature, buildingFeature])));

            const result = await service.loadBuildingsWithMetadata();

            expect(result.data).toEqual([buildingFeature, buildingFeature]);
            expect(result.fromCache).toBe(false);
        });

        it('should pass a plain array response through and use the streets resource URL', async () => {
            fetchMock.mockResolvedValueOnce(okResponse([streetFeature]));

            const result = await service.loadStreetsWithMetadata();

            expect(fetchMock.mock.calls[0]?.[0]).toBe('assets/calles.geojson');
            expect(result.data).toEqual([streetFeature]);
        });

        it('should reject on an invalid JSON shape without a features array', async () => {
            fetchMock.mockResolvedValueOnce(okResponse({ type: 'FeatureCollection' }));

            await expect(service.loadBuildings()).rejects.toThrow('Invalid data format');
        });

        it('should reject including the HTTP status when the response is not ok', async () => {
            fetchMock.mockResolvedValueOnce(errorResponse(500, 'Internal Server Error'));

            await expect(service.loadBuildings()).rejects.toThrow('Failed to fetch assets/fonavi.geojson: 500');
        });
    });

    describe('cache management', () => {
        it('should refreshCache by force-fetching both datasets even with fresh cache', async () => {
            mockGetData.mockResolvedValue(freshBuildingsEntry());

            await service.refreshCache();

            expect(fetchMock).toHaveBeenCalledTimes(2);
            const urls = fetchMock.mock.calls.map(call => call[0]);
            expect(urls).toEqual(expect.arrayContaining(['assets/fonavi.geojson', 'assets/calles.geojson']));
            expect(mockSaveData).toHaveBeenCalledTimes(2);
        });

        it('should map isDataFresh results per dataset in isDataAvailableOffline', async () => {
            mockIsDataFresh.mockImplementation(async (id: string) => id === 'buildings');

            const availability = await service.isDataAvailableOffline();

            expect(availability).toEqual({ buildings: true, streets: false });
            expect(mockIsDataFresh).toHaveBeenCalledWith('buildings');
            expect(mockIsDataFresh).toHaveBeenCalledWith('streets');
        });

        it('should aggregate both cache entries and the total size in getCacheInfo', async () => {
            const buildingsEntry = freshBuildingsEntry();
            const streetsEntry: CacheEntry<StreetFeature[]> = {
                id: 'streets',
                data: [streetFeature],
                timestamp: Date.now(),
                version: '1.0.0'
            };
            mockGetData.mockImplementation(async (id: string) => (id === 'buildings' ? buildingsEntry : streetsEntry));
            mockGetCacheSize.mockResolvedValue(4242);

            const info = await service.getCacheInfo();

            expect(info).toEqual({
                buildings: buildingsEntry,
                streets: streetsEntry,
                totalSize: 4242
            });
        });
    });
});
