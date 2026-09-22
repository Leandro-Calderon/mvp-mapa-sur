import { logger } from '../utils/logger';

export interface ConnectionStatus {
  isOnline: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

type ConnectionListener = (status: ConnectionStatus) => void;

// Minimal shape of the experimental Network Information API (navigator.connection)
interface NetworkInformationLike extends EventTarget {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

const getNetworkInformation = (): NetworkInformationLike | undefined =>
  'connection' in navigator
    ? (navigator as Navigator & { connection?: NetworkInformationLike }).connection
    : undefined;

class ConnectionService {
  private listeners: Set<ConnectionListener> = new Set();
  private currentStatus: ConnectionStatus = {
    isOnline: navigator.onLine
  };

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // Listen for online/offline events
    window.addEventListener('online', this.handleConnectionChange.bind(this));
    window.addEventListener('offline', this.handleConnectionChange.bind(this));

    // Listen for network information changes if available
    const connection = getNetworkInformation();
    if (connection) {
      connection.addEventListener('change', this.handleConnectionChange.bind(this));
    }

    // Initial status
    this.updateConnectionStatus();
  }

  private handleConnectionChange(): void {
    this.updateConnectionStatus();
    this.notifyListeners();
  }

  private updateConnectionStatus(): void {
    this.currentStatus = {
      isOnline: navigator.onLine
    };

    // Add network information if available
    const connection = getNetworkInformation();
    if (connection) {
      this.currentStatus = {
        ...this.currentStatus,
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentStatus);
      } catch (error) {
        logger.error('Error in connection listener', error);
      }
    });
  }

  public getConnectionStatus(): ConnectionStatus {
    return { ...this.currentStatus };
  }

  public isOnline(): boolean {
    return this.currentStatus.isOnline;
  }

  public addListener(listener: ConnectionListener): () => void {
    this.listeners.add(listener);

    // Immediately call with current status
    try {
      listener(this.currentStatus);
    } catch (error) {
      logger.error('Error in new connection listener', error);
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  public removeListener(listener: ConnectionListener): void {
    this.listeners.delete(listener);
  }

  public async waitForConnection(timeoutMs: number = 30000): Promise<boolean> {
    if (this.isOnline()) {
      return true;
    }

    return new Promise((resolve) => {
      let timeoutId: ReturnType<typeof setTimeout>;
      let unsubscribe: (() => void) | null = null;

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (unsubscribe) unsubscribe();
      };

      // Set up timeout
      timeoutId = setTimeout(() => {
        cleanup();
        resolve(false);
      }, timeoutMs);

      // Listen for connection
      unsubscribe = this.addListener((status) => {
        if (status.isOnline) {
          cleanup();
          resolve(true);
        }
      });
    });
  }

  public getNetworkQuality(): 'slow' | 'medium' | 'fast' | 'unknown' {
    if (!this.isOnline()) return 'unknown';

    const connection = getNetworkInformation();
    if (!connection) return 'unknown';

    const { effectiveType } = connection;
    const downlink = connection.downlink;

    if (effectiveType === 'slow-2g' || effectiveType === '2g' || (downlink !== undefined && downlink < 0.1)) {
      return 'slow';
    } else if (effectiveType === '3g' || (downlink !== undefined && downlink < 1)) {
      return 'medium';
    } else if (effectiveType === '4g' || (downlink !== undefined && downlink >= 1)) {
      return 'fast';
    }

    return 'unknown';
  }

  public shouldUseOfflineFirst(): boolean {
    const quality = this.getNetworkQuality();
    return !this.isOnline() || quality === 'slow';
  }
}

// Singleton instance
export const connectionService = new ConnectionService();