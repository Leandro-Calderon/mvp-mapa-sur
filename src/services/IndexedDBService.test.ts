import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { indexedDBService } from './IndexedDBService';
import type { SyncStatus } from './IndexedDBService';
import type { BuildingFeature, StreetFeature } from '../types/geojson';

const buildingFeature: BuildingFeature = {
    type: 'Feature',
    properties: { tipo: 'Edificio', nombre: 12, plan: '2021', id: 12 },
    geometry: { type: 'Point', coordinates: [-60.66904, -32.93968] }
};

const anotherBuildingFeature: BuildingFeature = {
    type: 'Feature',
    properties: { tipo: 'Edificio', nombre: 34, plan: '2021', id: 34 },
    geometry: { type: 'Point', coordinates: [-60.668, -32.94] }
};

const streetFeature: StreetFeature = {
    type: 'Feature',
    properties: { nombre: 'Calle Test', tipo: 'Calle' },
    geometry: { type: 'LineString', coordinates: [[-60.669, -32.939], [-60.67, -32.94]] }
};

/**
 * Removes leftover rows from the 'sync_status' store.
 *
 * clearCache() only clears 'geojson_cache', and the singleton keeps its
 * IDBDatabase connection open for the whole process, so
 * indexedDB.deleteDatabase('MapaSurDB') would block forever. Instead we open
 * our own short-lived connection (same name/version, no upgrade triggered)
 * and clear the store directly. It must run AFTER indexedDBService.clearCache()
 * so the database and its stores are guaranteed to exist.
 */
const clearSyncStatusStore = async (): Promise<void> => {
    await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('MapaSurDB', 1);
        request.onerror = () => {
            reject(new Error(`Failed to open MapaSurDB: ${request.error?.message}`));
        };
        request.onsuccess = () => {
            const db = request.result;
            const clearRequest = db
                .transaction(['sync_status'], 'readwrite')
                .objectStore('sync_status')
                .clear();
            clearRequest.onerror = () => {
                db.close();
                reject(new Error(`Failed to clear sync_status: ${clearRequest.error?.message}`));
            };
            clearRequest.onsuccess = () => {
                db.close();
                resolve();
            };
        };
    });
};

describe('IndexedDBService', () => {
    beforeEach(async () => {
        // clearCache lazily opens the database (creating both stores) and
        // empties 'geojson_cache'; the sync store is cleared manually.
        await indexedDBService.clearCache();
        await clearSyncStatusStore();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should save data and read back the full cache entry', async () => {
        await indexedDBService.saveData('buildings', [buildingFeature]);

        const entry = await indexedDBService.getData<BuildingFeature[]>('buildings');

        expect(entry).toMatchObject({
            id: 'buildings',
            data: [buildingFeature],
            version: '1.0.0'
        });
        expect(typeof entry?.timestamp).toBe('number');
        // etag is optional and simply omitted when not provided
        expect(entry?.etag).toBeUndefined();
    });

    it('should persist a custom version and etag when provided', async () => {
        await indexedDBService.saveData('buildings', [buildingFeature], '2.0.0', 'etag-42');

        const entry = await indexedDBService.getData<BuildingFeature[]>('buildings');

        expect(entry).toMatchObject({
            version: '2.0.0',
            etag: 'etag-42'
        });
    });

    it('should return null for a missing key', async () => {
        const entry = await indexedDBService.getData<BuildingFeature[]>('buildings');

        expect(entry).toBeNull();
    });

    it('should overwrite the previous entry when saving the same id twice', async () => {
        await indexedDBService.saveData('buildings', [buildingFeature], '1.0.0');
        await indexedDBService.saveData('buildings', [anotherBuildingFeature], '2.0.0');

        const entry = await indexedDBService.getData<BuildingFeature[]>('buildings');

        expect(entry).toMatchObject({
            id: 'buildings',
            data: [anotherBuildingFeature],
            version: '2.0.0'
        });
    });

    it('should return all cached ids', async () => {
        expect(await indexedDBService.getAllCachedIds()).toEqual([]);

        await indexedDBService.saveData('buildings', [buildingFeature]);
        await indexedDBService.saveData('streets', [streetFeature]);

        const ids = await indexedDBService.getAllCachedIds();

        expect([...ids].sort()).toEqual(['buildings', 'streets']);
    });

    it('should report missing entries as not fresh', async () => {
        expect(await indexedDBService.isDataFresh('buildings', 60_000)).toBe(false);
    });

    it('should compute freshness from the entry age against maxAgeMs', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date('2025-06-01T12:00:00Z').getTime());

        await indexedDBService.saveData('buildings', [buildingFeature]);

        // Fresh: age 0
        expect(await indexedDBService.isDataFresh('buildings', 60_000)).toBe(true);

        // Just below the boundary: age 59s for maxAgeMs 60s
        vi.setSystemTime(new Date('2025-06-01T12:00:59Z').getTime());
        expect(await indexedDBService.isDataFresh('buildings', 60_000)).toBe(true);

        // Exactly at maxAgeMs is already stale (strict < comparison)
        vi.setSystemTime(new Date('2025-06-01T12:01:00Z').getTime());
        expect(await indexedDBService.isDataFresh('buildings', 60_000)).toBe(false);
    });

    it('should save and read back the sync status roundtrip', async () => {
        const status: SyncStatus = {
            lastSync: 1_750_000_000_000,
            isOnline: true,
            pendingUpdates: ['buildings', 'streets']
        };

        await indexedDBService.saveSyncStatus(status);

        const loaded = await indexedDBService.getSyncStatus();

        expect(loaded).toMatchObject(status);
        // getSyncStatus must not leak the internal 'id' row key: the
        // returned object carries exactly the three SyncStatus fields.
        expect(loaded).not.toHaveProperty('id');
        expect(Object.keys(loaded ?? {}).sort()).toEqual(['isOnline', 'lastSync', 'pendingUpdates']);
    });

    it('should return null sync status when none was saved', async () => {
        expect(await indexedDBService.getSyncStatus()).toBeNull();
    });

    it('should empty cached entries on clearCache', async () => {
        await indexedDBService.saveData('buildings', [buildingFeature]);

        await indexedDBService.clearCache();

        expect(await indexedDBService.getData<BuildingFeature[]>('buildings')).toBeNull();
    });

    it('should keep the sync status on clearCache (only the geojson store is cleared)', async () => {
        const status: SyncStatus = { lastSync: 42, isOnline: false, pendingUpdates: [] };
        await indexedDBService.saveSyncStatus(status);

        await indexedDBService.clearCache();

        expect(await indexedDBService.getSyncStatus()).toMatchObject(status);
    });

    it('should report cache size of 0 when empty, growing with stored data', async () => {
        expect(await indexedDBService.getCacheSize()).toBe(0);

        await indexedDBService.saveData('buildings', [buildingFeature]);
        const smallSize = await indexedDBService.getCacheSize();
        expect(smallSize).toBeGreaterThan(0);

        // Overwriting the same key with more (longer) data grows the size
        await indexedDBService.saveData('buildings', [buildingFeature, anotherBuildingFeature]);
        const largeSize = await indexedDBService.getCacheSize();
        expect(largeSize).toBeGreaterThan(smallSize);
    });
});
