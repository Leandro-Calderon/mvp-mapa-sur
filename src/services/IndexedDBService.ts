import type { BuildingFeature, StreetFeature } from '../types/geojson';

export interface CacheEntry<T> {
  id: string;
  data: T;
  timestamp: number;
  version: string;
  etag?: string;
}

export interface SyncStatus {
  lastSync: number;
  isOnline: boolean;
  pendingUpdates: string[];
}

class IndexedDBService {
  private readonly DB_NAME = 'MapaSurDB';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'geojson_cache';
  private readonly SYNC_STORE_NAME = 'sync_status';

  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create cache store
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const cacheStore = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
          cacheStore.createIndex('version', 'version', { unique: false });
        }

        // Create sync status store
        if (!db.objectStoreNames.contains(this.SYNC_STORE_NAME)) {
          const syncStore = db.createObjectStore(this.SYNC_STORE_NAME, { keyPath: 'id' });
          syncStore.createIndex('lastSync', 'lastSync', { unique: false });
        }
      };
    });
  }

  async saveData<T extends BuildingFeature[] | StreetFeature[]>(
    id: string,
    data: T,
    version: string = '1.0.0',
    etag?: string
  ): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    const entry: CacheEntry<T> = {
      id,
      data,
      timestamp: Date.now(),
      version,
      etag
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      const request = store.put(entry);

      request.onerror = () => {
        reject(new Error(`Failed to save data: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  async getData<T extends BuildingFeature[] | StreetFeature[]>(id: string): Promise<CacheEntry<T> | null> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);

      const request = store.get(id);

      request.onerror = () => {
        reject(new Error(`Failed to get data: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        resolve(request.result || null);
      };
    });
  }

  async getAllCachedIds(): Promise<string[]> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAllKeys();

      request.onerror = () => {
        reject(new Error(`Failed to get all keys: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        resolve(request.result as string[]);
      };
    });
  }

  async isDataFresh(id: string, maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<boolean> {
    try {
      const entry = await this.getData(id);
      if (!entry) return false;

      const now = Date.now();
      return (now - entry.timestamp) < maxAgeMs;
    } catch {
      return false;
    }
  }

  async saveSyncStatus(status: SyncStatus): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    const entry = {
      id: 'main',
      ...status
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.SYNC_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.SYNC_STORE_NAME);

      const request = store.put(entry);

      request.onerror = () => {
        reject(new Error(`Failed to save sync status: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  async getSyncStatus(): Promise<SyncStatus | null> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.SYNC_STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.SYNC_STORE_NAME);

      const request = store.get('main');

      request.onerror = () => {
        reject(new Error(`Failed to get sync status: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        resolve(request.result || null);
      };
    });
  }

  async clearCache(): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      const request = store.clear();

      request.onerror = () => {
        reject(new Error(`Failed to clear cache: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  async getCacheSize(): Promise<number> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);

      let totalSize = 0;
      const request = store.openCursor();

      request.onerror = () => {
        reject(new Error(`Failed to calculate cache size: ${request.error?.message}`));
      };

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          totalSize += JSON.stringify(cursor.value).length;
          cursor.continue();
        } else {
          resolve(totalSize);
        }
      };
    });
  }
}

// Singleton instance
export const indexedDBService = new IndexedDBService();