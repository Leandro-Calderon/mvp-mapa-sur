import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { connectionService } from './ConnectionService';
import type { ConnectionStatus } from './ConnectionService';

// Minimal shape of the experimental Network Information API
interface ConnectionStub {
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
}

const setNavigatorOnLine = (online: boolean): void => {
    Object.defineProperty(navigator, 'onLine', { value: online, configurable: true });
};

const setNavigatorConnection = (connection?: ConnectionStub): void => {
    if (connection === undefined) {
        delete (navigator as Navigator & { connection?: ConnectionStub }).connection;
    } else {
        Object.defineProperty(navigator, 'connection', { value: connection, configurable: true });
    }
};

const goOnline = (): void => {
    setNavigatorOnLine(true);
    window.dispatchEvent(new Event('online'));
};

const goOffline = (): void => {
    setNavigatorOnLine(false);
    window.dispatchEvent(new Event('offline'));
};

describe('ConnectionService', () => {
    beforeEach(() => {
        // jsdom defaults: navigator.onLine === true, no navigator.connection.
        // Dispatching the events makes the singleton re-read navigator.
        goOnline();
        setNavigatorConnection(undefined);
    });

    afterEach(() => {
        goOnline();
        setNavigatorConnection(undefined);
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('should return a copy of the connection status', () => {
        const status = connectionService.getConnectionStatus();
        expect(status.isOnline).toBe(true);

        // Mutating the returned object must not affect the service state
        status.isOnline = !status.isOnline;

        expect(connectionService.getConnectionStatus().isOnline).toBe(true);
    });

    it('should track navigator.onLine after online/offline events', () => {
        expect(connectionService.isOnline()).toBe(true);

        goOffline();
        expect(connectionService.isOnline()).toBe(false);

        goOnline();
        expect(connectionService.isOnline()).toBe(true);
    });

    it('should call new listeners immediately and on later events', () => {
        const listener = vi.fn<(status: ConnectionStatus) => void>();
        const unsubscribe = connectionService.addListener(listener);

        // Immediate callback with the current status
        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ isOnline: true }));

        // Updates on connection events
        goOffline();
        expect(listener).toHaveBeenCalledTimes(2);
        expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ isOnline: false }));

        goOnline();
        expect(listener).toHaveBeenCalledTimes(3);
        expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ isOnline: true }));

        // The returned unsubscribe function stops delivery
        unsubscribe();
        goOffline();
        expect(listener).toHaveBeenCalledTimes(3);
    });

    it('should stop delivery after removeListener', () => {
        const listener = vi.fn<(status: ConnectionStatus) => void>();
        connectionService.addListener(listener);
        listener.mockClear();

        connectionService.removeListener(listener);

        goOffline();
        expect(listener).not.toHaveBeenCalled();
    });

    it('should keep notifying other listeners when one listener throws', () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        const explodingListener = vi.fn((): void => {
            throw new Error('listener exploded');
        });
        const survivingListener = vi.fn<(status: ConnectionStatus) => void>();

        try {
            connectionService.addListener(explodingListener);
            connectionService.addListener(survivingListener);
            survivingListener.mockClear();
            explodingListener.mockClear();

            goOffline();

            expect(explodingListener).toHaveBeenCalledTimes(1);
            expect(survivingListener).toHaveBeenCalledTimes(1);
            expect(survivingListener).toHaveBeenCalledWith(expect.objectContaining({ isOnline: false }));
            expect(consoleError).toHaveBeenCalled();
        } finally {
            connectionService.removeListener(explodingListener);
            connectionService.removeListener(survivingListener);
        }
    });

    it('should report unknown network quality when offline', () => {
        goOffline();

        expect(connectionService.getNetworkQuality()).toBe('unknown');
    });

    it('should report unknown network quality when online without navigator.connection', () => {
        // beforeEach removed any connection stub; jsdom has none by default
        expect(connectionService.getNetworkQuality()).toBe('unknown');
    });

    it('should classify slow connections from effectiveType or downlink', () => {
        setNavigatorConnection({ effectiveType: 'slow-2g' });
        expect(connectionService.getNetworkQuality()).toBe('slow');

        setNavigatorConnection({ effectiveType: '2g' });
        expect(connectionService.getNetworkQuality()).toBe('slow');

        setNavigatorConnection({ downlink: 0.05 });
        expect(connectionService.getNetworkQuality()).toBe('slow');
    });

    it('should classify medium connections from effectiveType or downlink', () => {
        setNavigatorConnection({ effectiveType: '3g' });
        expect(connectionService.getNetworkQuality()).toBe('medium');

        setNavigatorConnection({ downlink: 0.5 });
        expect(connectionService.getNetworkQuality()).toBe('medium');
    });

    it('should classify fast connections from effectiveType or downlink', () => {
        setNavigatorConnection({ effectiveType: '4g' });
        expect(connectionService.getNetworkQuality()).toBe('fast');

        setNavigatorConnection({ downlink: 1 });
        expect(connectionService.getNetworkQuality()).toBe('fast');

        setNavigatorConnection({ downlink: 10 });
        expect(connectionService.getNetworkQuality()).toBe('fast');
    });

    it('should report unknown quality when connection exposes neither effectiveType nor downlink', () => {
        setNavigatorConnection({});

        expect(connectionService.getNetworkQuality()).toBe('unknown');
    });

    it('should use offline-first when offline or on a slow connection', () => {
        goOffline();
        expect(connectionService.shouldUseOfflineFirst()).toBe(true);

        goOnline();
        setNavigatorConnection({ downlink: 0.05 });
        expect(connectionService.shouldUseOfflineFirst()).toBe(true);
    });

    it('should not use offline-first on medium or fast connections', () => {
        setNavigatorConnection({ effectiveType: '3g' });
        expect(connectionService.shouldUseOfflineFirst()).toBe(false);

        setNavigatorConnection({ effectiveType: '4g' });
        expect(connectionService.shouldUseOfflineFirst()).toBe(false);
    });

    it('should resolve waitForConnection immediately when already online', async () => {
        await expect(connectionService.waitForConnection(1000)).resolves.toBe(true);
    });

    it('should resolve waitForConnection false after the timeout when offline', async () => {
        vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
        goOffline();

        const promise = connectionService.waitForConnection(5000);
        const assertion = expect(promise).resolves.toBe(false);

        await vi.advanceTimersByTimeAsync(5000);
        await assertion;
    });

    it('should resolve waitForConnection true when the online event fires before the timeout', async () => {
        vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
        goOffline();

        const promise = connectionService.waitForConnection(30_000);

        // Reconnect before the timeout elapses
        goOnline();
        await expect(promise).resolves.toBe(true);

        // The waiter cleaned up after itself: later timers/events cause nothing
        await vi.advanceTimersByTimeAsync(30_000);
        goOffline();
        goOnline();
    });
});
