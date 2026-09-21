import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDataService } from './useDataService';
import type { DataService } from '../services/DataService';
import type { OfflineDataServiceResult } from '../services/OfflineDataService';
import type { BuildingFeature, StreetFeature } from '../types/geojson';

const { mockIsOnline, mockShouldUseOfflineFirst, mockAddListener, mockGetNetworkQuality } = vi.hoisted(() => ({
    mockIsOnline: vi.fn<() => boolean>(),
    mockShouldUseOfflineFirst: vi.fn<() => boolean>(),
    mockAddListener: vi.fn<(listener: (status: { isOnline: boolean }) => void) => () => void>(),
    mockGetNetworkQuality: vi.fn<() => string>()
}));

vi.mock('../services/ConnectionService', () => ({
    connectionService: {
        isOnline: mockIsOnline,
        shouldUseOfflineFirst: mockShouldUseOfflineFirst,
        addListener: mockAddListener,
        getNetworkQuality: mockGetNetworkQuality
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

interface MetadataLoadOptions {
    forceRefresh: boolean;
    preferOffline: boolean;
}

/**
 * Builds a mock DataService exposing both the basic loaders and the
 * metadata-aware loaders, returning typed handles for assertions.
 */
const createMetadataService = () => {
    const loadBuildings = vi.fn(async (): Promise<BuildingFeature[]> => [buildingFeature]);
    const loadStreets = vi.fn(async (): Promise<StreetFeature[]> => [streetFeature]);
    const loadBuildingsWithMetadata = vi.fn(
        async (_options: MetadataLoadOptions): Promise<OfflineDataServiceResult<BuildingFeature[]>> => ({
            data: [buildingFeature],
            fromCache: false,
            isStale: false,
            lastUpdated: 1000
        })
    );
    const loadStreetsWithMetadata = vi.fn(
        async (_options: MetadataLoadOptions): Promise<OfflineDataServiceResult<StreetFeature[]>> => ({
            data: [streetFeature],
            fromCache: false,
            isStale: false,
            lastUpdated: 2000
        })
    );

    const service: DataService & {
        loadBuildingsWithMetadata: (options: MetadataLoadOptions) => Promise<OfflineDataServiceResult<BuildingFeature[]>>;
        loadStreetsWithMetadata: (options: MetadataLoadOptions) => Promise<OfflineDataServiceResult<StreetFeature[]>>;
    } = {
        loadBuildings,
        loadStreets,
        loadBuildingsWithMetadata,
        loadStreetsWithMetadata
    };

    return { service, loadBuildings, loadStreets, loadBuildingsWithMetadata, loadStreetsWithMetadata };
};

const flushMicrotasks = async (): Promise<void> => {
    for (let i = 0; i < 10; i += 1) {
        await Promise.resolve();
    }
};

describe('useDataService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockIsOnline.mockReturnValue(true);
        mockShouldUseOfflineFirst.mockReturnValue(false);
        mockGetNetworkQuality.mockReturnValue('fast');
        mockAddListener.mockImplementation(() => () => undefined);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should start with loading true, empty data and no error', () => {
        const { service, loadBuildingsWithMetadata, loadStreetsWithMetadata } = createMetadataService();
        // Loaders that never settle keep the hook in its initial state
        loadBuildingsWithMetadata.mockImplementation(
            () => new Promise<OfflineDataServiceResult<BuildingFeature[]>>(() => {})
        );
        loadStreetsWithMetadata.mockImplementation(
            () => new Promise<OfflineDataServiceResult<StreetFeature[]>>(() => {})
        );

        const { result } = renderHook(() => useDataService(service));

        expect(result.current.buildings).toEqual({
            data: [],
            loading: true,
            error: null,
            fromCache: false,
            isStale: false
        });
        expect(result.current.streets).toEqual({
            data: [],
            loading: true,
            error: null,
            fromCache: false,
            isStale: false
        });
    });

    it('should propagate metadata results from the metadata-aware loaders', async () => {
        const { service, loadBuildingsWithMetadata, loadStreetsWithMetadata } = createMetadataService();
        loadBuildingsWithMetadata.mockResolvedValue({
            data: [buildingFeature],
            fromCache: true,
            isStale: false,
            lastUpdated: 111
        });
        loadStreetsWithMetadata.mockResolvedValue({
            data: [streetFeature],
            fromCache: false,
            isStale: false,
            lastUpdated: 222
        });

        const { result } = renderHook(() => useDataService(service));

        await act(async () => {
            await flushMicrotasks();
        });

        expect(result.current.buildings).toEqual({
            data: [buildingFeature],
            loading: false,
            error: null,
            fromCache: true,
            isStale: false,
            lastUpdated: 111
        });
        expect(result.current.streets.fromCache).toBe(false);
        expect(result.current.streets.lastUpdated).toBe(222);
        expect(result.current.streets.loading).toBe(false);
        // Connection status wiring
        expect(result.current.isOnline).toBe(true);
        expect(result.current.networkQuality).toBe('fast');
    });

    it('should schedule a background forceRefresh when stale data is served while online', async () => {
        // jsdom has no requestIdleCallback, so the hook defers via setTimeout(cb, 1000)
        vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });

        const { service, loadBuildingsWithMetadata, loadStreetsWithMetadata } = createMetadataService();
        loadBuildingsWithMetadata
            .mockResolvedValueOnce({
                data: [buildingFeature],
                fromCache: true,
                isStale: true,
                lastUpdated: 100
            })
            .mockResolvedValue({
                data: [buildingFeature],
                fromCache: false,
                isStale: false,
                lastUpdated: 500
            });
        loadStreetsWithMetadata.mockResolvedValue({
            data: [streetFeature],
            fromCache: true,
            isStale: false,
            lastUpdated: 200
        });

        const { result } = renderHook(() => useDataService(service));

        await act(async () => {
            await flushMicrotasks();
        });

        expect(loadBuildingsWithMetadata).toHaveBeenCalledTimes(1);
        expect(loadBuildingsWithMetadata.mock.calls[0]?.[0]).toEqual({ forceRefresh: false, preferOffline: false });
        expect(result.current.buildings.isStale).toBe(true);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(1000);
            await flushMicrotasks();
        });

        expect(loadBuildingsWithMetadata).toHaveBeenCalledTimes(2);
        expect(loadBuildingsWithMetadata.mock.calls[1]?.[0]).toEqual({ forceRefresh: true, preferOffline: false });
        // The shared refresh reloads both datasets
        expect(loadStreetsWithMetadata).toHaveBeenCalledTimes(2);
        expect(result.current.buildings.isStale).toBe(false);
        expect(result.current.buildings.lastUpdated).toBe(500);
    });

    it('should set the error and empty data when a metadata loader rejects', async () => {
        const { service, loadBuildingsWithMetadata, loadStreetsWithMetadata } = createMetadataService();
        loadBuildingsWithMetadata.mockRejectedValue(new Error('buildings source unavailable'));
        loadStreetsWithMetadata.mockResolvedValue({
            data: [streetFeature],
            fromCache: false,
            isStale: false,
            lastUpdated: 222
        });

        const { result } = renderHook(() => useDataService(service));

        await act(async () => {
            await flushMicrotasks();
        });

        expect(result.current.buildings.loading).toBe(false);
        expect(result.current.buildings.error).toBeInstanceOf(Error);
        expect(result.current.buildings.error?.message).toBe('buildings source unavailable');
        expect(result.current.buildings.data).toEqual([]);
        // Streets are unaffected by the buildings failure
        expect(result.current.streets.loading).toBe(false);
        expect(result.current.streets.error).toBeNull();
    });

    it('should fall back to the basic loaders when the service has no metadata methods', async () => {
        const loadBuildings = vi.fn(async (): Promise<BuildingFeature[]> => [buildingFeature]);
        const loadStreets = vi.fn(async (): Promise<StreetFeature[]> => [streetFeature]);
        const service: DataService = { loadBuildings, loadStreets };

        const { result } = renderHook(() => useDataService(service));

        await act(async () => {
            await flushMicrotasks();
        });

        expect(loadBuildings).toHaveBeenCalledTimes(1);
        expect(loadStreets).toHaveBeenCalledTimes(1);
        expect(result.current.buildings).toEqual({
            data: [buildingFeature],
            loading: false,
            error: null,
            fromCache: false,
            isStale: false
        });
        expect(result.current.streets.data).toEqual([streetFeature]);
    });

    it('should refresh on reconnect (isOnline true) but not on disconnect', async () => {
        const { service, loadBuildingsWithMetadata, loadStreetsWithMetadata } = createMetadataService();

        const { result } = renderHook(() => useDataService(service));

        await act(async () => {
            await flushMicrotasks();
        });

        expect(mockAddListener).toHaveBeenCalledTimes(1);
        const listener = mockAddListener.mock.calls[0]?.[0];
        expect(listener).toBeTypeOf('function');

        // Reconnect notification forces a refresh
        await act(async () => {
            await listener?.({ isOnline: true });
            await flushMicrotasks();
        });

        expect(loadBuildingsWithMetadata).toHaveBeenCalledTimes(2);
        expect(loadBuildingsWithMetadata.mock.calls[1]?.[0]).toEqual({ forceRefresh: true, preferOffline: false });
        expect(loadStreetsWithMetadata).toHaveBeenCalledTimes(2);

        // Disconnect notification does not trigger a load
        const callsAfterReconnect = loadBuildingsWithMetadata.mock.calls.length;
        await act(async () => {
            await listener?.({ isOnline: false });
            await flushMicrotasks();
        });

        expect(loadBuildingsWithMetadata.mock.calls.length).toBe(callsAfterReconnect);
        expect(result.current.buildings.loading).toBe(false);
    });

    it('should trigger a forceRefresh load when refresh() is called', async () => {
        const { service, loadBuildingsWithMetadata, loadStreetsWithMetadata } = createMetadataService();

        const { result } = renderHook(() => useDataService(service));

        await act(async () => {
            await flushMicrotasks();
        });

        expect(loadBuildingsWithMetadata).toHaveBeenCalledTimes(1);

        await act(async () => {
            result.current.refresh();
            await flushMicrotasks();
        });

        expect(loadBuildingsWithMetadata).toHaveBeenCalledTimes(2);
        expect(loadBuildingsWithMetadata.mock.calls[1]?.[0]).toEqual({ forceRefresh: true, preferOffline: false });
        expect(loadStreetsWithMetadata).toHaveBeenCalledTimes(2);
    });
});
