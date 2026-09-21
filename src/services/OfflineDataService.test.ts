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

const freshBuildingsEntry = (etag?: string): CacheEntry<BuildingFeature[]> => ({
    id: 'buildings',
    data: [buildingFeature],
    timestamp: Date.now(),
    version: '1.0.0',
    etag
});

const staleBuildingsEntry = (etag?: string): CacheEntry<BuildingFeature[]> => ({
    id: 'buildings',
    data: [buildingFeature],
    timestamp: Date.now() - 25 * HOUR_MS, // older than the default 24h max age
    version: '1.0.0',
    etag
});

// Real global Response objects: the service reads ok/status/statusText/json
// and, since the ETag redesign, response.headers.get('etag'). A Response body
// can only be consumed once, so every helper call builds a fresh instance.
const okResponse = <T>(payload: T, headers: Record<string, string> = {}): Response =>
    new Response(JSON.stringify(payload), { status: 200, statusText: 'OK', headers });

const notModifiedResponse = (etag?: string): Response =>
    new Response(null, { status: 304, statusText: 'Not Modified', headers: etag ? { etag } : {} });

const errorResponse = (status: number, statusText: string): Response =>
    new Response(null, { status, statusText });

const featureCollection = (features: unknown[]): { type: 'FeatureCollection'; features: unknown[] } => ({
    type: 'FeatureCollection',
    features
});

describe('OfflineDataService', () => {
    let service: OfflineDataService;
    // Stubbed global fetch; in vitest import.meta.env.DEV is true, so the
    // service builds URLs like 'assets/fonavi.geojson' (no base path).
    // The service calls fetch(url, { headers: { 'Cache-Control', 'Pragma' } })
    // and adds 'If-None-Match' when revalidating with a stored ETag.
    const fetchMock = vi.fn<(input: string, init?: { headers?: Record<string, string> }) => Promise<Response>>();

    beforeEach(() => {
        vi.clearAllMocks();
        service = new OfflineDataService();

        mockIsOnline.mockReturnValue(true);
        mockShouldUseOfflineFirst.mockReturnValue(false);
        mockGetData.mockResolvedValue(null);

        fetchMock.mockReset();
        // Fresh Response per call (bodies are single-read)
        fetchMock.mockImplementation(async () =>
            okResponse(featureCollection([buildingFeature]), { etag: '"etag-net"' })
        );
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

        it('should fetch from network when online with no cache and store the response ETag', async () => {
            mockGetData.mockResolvedValue(null);
            const before = Date.now();

            const result = await service.loadBuildingsWithMetadata();

            const after = Date.now();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(fetchMock.mock.calls[0]?.[0]).toBe('assets/fonavi.geojson');
            expect(fetchMock.mock.calls[0]?.[1]?.headers).toEqual({ 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' });
            expect(mockSaveData).toHaveBeenCalledTimes(1);
            // The REAL response ETag is stored, not a date string
            expect(mockSaveData).toHaveBeenCalledWith('buildings', [buildingFeature], '1.0.0', '"etag-net"');
            expect(result.data).toEqual([buildingFeature]);
            expect(result.fromCache).toBe(false);
            expect(result.isStale).toBe(false);
            expect(result.lastUpdated).toBeGreaterThanOrEqual(before);
            expect(result.lastUpdated).toBeLessThanOrEqual(after);
        });

        it('should revalidate a FRESH cached entry with If-None-Match when online and honor 304', async () => {
            // Redesigned contract: online + cache (fresh OR stale) always
            // revalidates; the 24h TTL no longer gates network contact.
            const entry = freshBuildingsEntry('"etag-cached"');
            mockGetData.mockResolvedValue(entry);
            fetchMock.mockImplementationOnce(async () => notModifiedResponse('"etag-cached"'));
            const before = Date.now();

            const result = await service.loadBuildingsWithMetadata();

            const after = Date.now();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(fetchMock.mock.calls[0]?.[1]?.headers).toEqual({
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'If-None-Match': '"etag-cached"'
            });
            expect(result.data).toEqual([buildingFeature]);
            expect(result.fromCache).toBe(true);
            expect(result.isStale).toBe(false);
            expect(result.lastUpdated).toBeGreaterThanOrEqual(before);
            expect(result.lastUpdated).toBeLessThanOrEqual(after);
            // The entry is re-saved (same data, same ETag) to bump its timestamp
            expect(mockSaveData).toHaveBeenCalledTimes(1);
            expect(mockSaveData).toHaveBeenCalledWith('buildings', [buildingFeature], '1.0.0', '"etag-cached"');
        });

        it('should mark a STALE cached entry as current after a 304 revalidation', async () => {
            const entry = staleBuildingsEntry('"etag-cached"');
            mockGetData.mockResolvedValue(entry);
            fetchMock.mockImplementationOnce(async () => notModifiedResponse('"etag-cached"'));

            const result = await service.loadBuildingsWithMetadata();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(fetchMock.mock.calls[0]?.[1]?.headers).toEqual({
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'If-None-Match': '"etag-cached"'
            });
            expect(result.fromCache).toBe(true);
            expect(result.isStale).toBe(false);
            expect(result.lastUpdated).toBeGreaterThanOrEqual(entry.timestamp);
        });

        it('should revalidate a STALE cached entry when online and serve new data from a 200', async () => {
            mockGetData.mockResolvedValue(staleBuildingsEntry('"etag-cached"'));
            fetchMock.mockImplementationOnce(async () =>
                okResponse(featureCollection([buildingFeature, buildingFeature]), { etag: '"etag-new"' })
            );

            const result = await service.loadBuildingsWithMetadata();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(fetchMock.mock.calls[0]?.[1]?.headers).toEqual({
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'If-None-Match': '"etag-cached"'
            });
            expect(result.data).toEqual([buildingFeature, buildingFeature]);
            expect(result.fromCache).toBe(false);
            expect(result.isStale).toBe(false);
            // The REAL response ETag is stored, not a date string
            expect(mockSaveData).toHaveBeenCalledWith('buildings', [buildingFeature, buildingFeature], '1.0.0', '"etag-new"');
        });

        it('should revalidate without an If-None-Match header when the entry has no stored ETag', async () => {
            mockGetData.mockResolvedValue(freshBuildingsEntry());
            fetchMock.mockImplementationOnce(async () => notModifiedResponse());

            const result = await service.loadBuildingsWithMetadata();

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(fetchMock.mock.calls[0]?.[1]?.headers).toEqual({ 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' });
            expect(fetchMock.mock.calls[0]?.[1]?.headers).not.toHaveProperty('If-None-Match');
            expect(result.fromCache).toBe(true);
            expect(result.isStale).toBe(false);
        });

        it('should update the stored ETag when a 304 response carries a new one', async () => {
            mockGetData.mockResolvedValue(freshBuildingsEntry('"etag-old"'));
            fetchMock.mockImplementationOnce(async () => notModifiedResponse('"etag-renewed"'));

            await service.loadBuildingsWithMetadata();

            expect(mockSaveData).toHaveBeenCalledWith('buildings', [buildingFeature], '1.0.0', '"etag-renewed"');
        });

        it('should fall back to a FRESH cache as not stale when revalidation fails', async () => {
            // Bug-fix pin: the old catch hardcoded isStale: true even for a
            // fresh cache; staleness is now determined by age only
            const entry = freshBuildingsEntry('"etag-cached"');
            mockGetData.mockResolvedValue(entry);
            fetchMock.mockRejectedValue(new Error('Network unavailable'));

            const result = await service.loadBuildingsWithMetadata();

            expect(result.fromCache).toBe(true);
            expect(result.isStale).toBe(false);
            expect(result.data).toEqual([buildingFeature]);
            expect(result.lastUpdated).toBe(entry.timestamp);
        });

        it('should fall back to a STALE cache flagged stale when revalidation fails', async () => {
            const entry = staleBuildingsEntry('"etag-cached"');
            mockGetData.mockResolvedValue(entry);
            fetchMock.mockRejectedValue(new Error('Network unavailable'));

            const result = await service.loadBuildingsWithMetadata();

            expect(result.fromCache).toBe(true);
            expect(result.isStale).toBe(true);
            expect(result.data).toEqual([buildingFeature]);
            expect(result.lastUpdated).toBe(entry.timestamp);
        });

        it('should ignore a cached copy when forceRefresh is set even with offline-first', async () => {
            mockShouldUseOfflineFirst.mockReturnValue(true);
            mockGetData.mockResolvedValue(freshBuildingsEntry());

            const result = await service.loadBuildingsWithMetadata({ forceRefresh: true });

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(result.fromCache).toBe(false);
            expect(result.data).toEqual([buildingFeature]);
        });

        it('should fall back to a FRESH cache as not stale when a forced refresh fails while online', async () => {
            // Bug-fix pin: the old catch hardcoded isStale: true even for a
            // fresh cache; staleness is now determined by age only
            mockGetData.mockResolvedValue(freshBuildingsEntry());
            fetchMock.mockRejectedValue(new Error('Network unavailable'));

            const result = await service.loadBuildingsWithMetadata({ forceRefresh: true });

            expect(result.fromCache).toBe(true);
            expect(result.isStale).toBe(false);
            expect(result.data).toEqual([buildingFeature]);
        });

        it('should serve the cache when forceRefresh is requested while offline', async () => {
            // Fall-through branch: forceRefresh cannot be honored offline, so
            // the cached copy is served and flagged stale only by age
            mockIsOnline.mockReturnValue(false);
            const entry = staleBuildingsEntry('"etag-cached"');
            mockGetData.mockResolvedValue(entry);

            const result = await service.loadBuildingsWithMetadata({ forceRefresh: true });

            expect(fetchMock).not.toHaveBeenCalled();
            expect(result.fromCache).toBe(true);
            expect(result.isStale).toBe(true);
            expect(result.lastUpdated).toBe(entry.timestamp);
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
            fetchMock.mockImplementationOnce(async () =>
                okResponse(featureCollection([buildingFeature, buildingFeature]))
            );

            const result = await service.loadBuildingsWithMetadata();

            expect(result.data).toEqual([buildingFeature, buildingFeature]);
            expect(result.fromCache).toBe(false);
        });

        it('should pass a plain array response through and use the streets resource URL', async () => {
            fetchMock.mockImplementationOnce(async () => okResponse([streetFeature]));

            const result = await service.loadStreetsWithMetadata();

            expect(fetchMock.mock.calls[0]?.[0]).toBe('assets/calles.geojson');
            expect(result.data).toEqual([streetFeature]);
        });

        it('should reject on an invalid JSON shape without a features array', async () => {
            fetchMock.mockImplementationOnce(async () => okResponse({ type: 'FeatureCollection' }));

            await expect(service.loadBuildings()).rejects.toThrow('Invalid data format');
        });

        it('should reject including the HTTP status when the response is not ok', async () => {
            fetchMock.mockImplementationOnce(async () => errorResponse(500, 'Internal Server Error'));

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
