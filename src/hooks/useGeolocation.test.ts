import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGeolocation } from './useGeolocation';

const makePosition = (
    latitude: number,
    longitude: number,
    accuracy = 10,
): GeolocationPosition => ({
    coords: {
        latitude,
        longitude,
        accuracy,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        toJSON: () => ({}),
    },
    timestamp: Date.now(),
    toJSON: () => ({}),
});

const makeError = (code: number, message = 'Geolocation error'): GeolocationPositionError => ({
    code,
    message,
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
});

describe('useGeolocation', () => {
    let mockGeolocation: {
        getCurrentPosition: ReturnType<typeof vi.fn>;
        watchPosition: ReturnType<typeof vi.fn>;
        clearWatch: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        // Mock geolocation API
        mockGeolocation = {
            getCurrentPosition: vi.fn(),
            watchPosition: vi.fn(),
            clearWatch: vi.fn(),
        };

        Object.defineProperty(globalThis.navigator, 'geolocation', {
            writable: true,
            value: mockGeolocation,
        });

        // Mock permissions API
        Object.defineProperty(globalThis.navigator, 'permissions', {
            writable: true,
            value: {
                query: vi.fn().mockResolvedValue({ state: 'granted' }),
            },
        });
    });

    it('should initialize with null position and inactive state', () => {
        const { result } = renderHook(() => useGeolocation());

        expect(result.current.position).toBeNull();
        expect(result.current.accuracy).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.errorKind).toBeNull();
        expect(result.current.isActive).toBe(false);
    });

    it('should start tracking when startTracking is called', async () => {
        const watchId = 123;
        mockGeolocation.watchPosition.mockReturnValue(watchId);

        const { result } = renderHook(() => useGeolocation());

        await act(async () => {
            result.current.startTracking();
            // Wait for async operations
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.isActive).toBe(true);
        // ONE high-accuracy watch plus ONE parallel coarse-first probe, nothing else
        expect(mockGeolocation.watchPosition).toHaveBeenCalledTimes(1);
        expect(mockGeolocation.watchPosition).toHaveBeenCalledWith(
            expect.any(Function),
            expect.any(Function),
            { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 },
        );
        expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledTimes(1);
        expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
            expect.any(Function),
            expect.any(Function),
            { enableHighAccuracy: false, maximumAge: 30000, timeout: 8000 },
        );
    });

    it('should update position on successful geolocation', async () => {
        mockGeolocation.watchPosition.mockImplementation((success) => {
            success(makePosition(40.7128, -74.006, 10));
            return 123;
        });

        const { result } = renderHook(() => useGeolocation());

        await act(async () => {
            result.current.startTracking();
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.position).toEqual([-74.006, 40.7128]);
        expect(result.current.accuracy).toBe(10);
        expect(result.current.error).toBeNull();
        expect(result.current.errorKind).toBeNull();
    });

    it('should handle geolocation errors', async () => {
        mockGeolocation.watchPosition.mockImplementation((success, error) => {
            error(makeError(1, 'User denied geolocation'));
            return 123;
        });

        const { result } = renderHook(() => useGeolocation());

        await act(async () => {
            result.current.startTracking();
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.error).toBe('User denied geolocation');
        expect(result.current.errorKind).toBe('denied');
        expect(result.current.position).toBeNull();
    });

    it('should map geolocation error codes to errorKind', async () => {
        const cases: Array<{ code: number; kind: 'denied' | 'unavailable' | 'timeout' | 'unknown' }> = [
            { code: 1, kind: 'denied' },
            { code: 2, kind: 'unavailable' },
            { code: 3, kind: 'timeout' },
            { code: 0, kind: 'unknown' },
        ];

        for (const { code, kind } of cases) {
            mockGeolocation.watchPosition.mockImplementation((success, error) => {
                error(makeError(code));
                return 123;
            });

            const { result } = renderHook(() => useGeolocation());

            await act(async () => {
                result.current.startTracking();
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            expect(result.current.errorKind).toBe(kind);
        }
    });

    it('should seed position from the coarse probe only while no fix exists', async () => {
        // Neither acquisition fires synchronously; we drive them by hand.
        mockGeolocation.watchPosition.mockReturnValue(123);
        mockGeolocation.getCurrentPosition.mockReturnValue(undefined);

        const { result } = renderHook(() => useGeolocation());

        await act(async () => {
            result.current.startTracking();
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        const coarseSuccess = mockGeolocation.getCurrentPosition.mock.calls[0]![0] as (pos: GeolocationPosition) => void;
        const watchSuccess = mockGeolocation.watchPosition.mock.calls[0]![0] as (pos: GeolocationPosition) => void;

        // Coarse fix arrives first -> seeds the approximate position
        act(() => {
            coarseSuccess(makePosition(-33.9, -60.7, 1500));
        });
        expect(result.current.position).toEqual([-60.7, -33.9]);
        expect(result.current.accuracy).toBe(1500);

        // A repeated coarse callback must NOT overwrite the seeded fix
        act(() => {
            coarseSuccess(makePosition(-34.0, -60.8, 2000));
        });
        expect(result.current.position).toEqual([-60.7, -33.9]);
        expect(result.current.accuracy).toBe(1500);

        // The high-accuracy watch fix owns updates and DOES overwrite the seed
        act(() => {
            watchSuccess(makePosition(-33.9001, -60.7001, 8));
        });
        expect(result.current.position).toEqual([-60.7001, -33.9001]);
        expect(result.current.accuracy).toBe(8);
    });

    it('should ignore the coarse probe once the watch has a fix', async () => {
        mockGeolocation.watchPosition.mockImplementation((success) => {
            success(makePosition(-33.9, -60.7, 8));
            return 123;
        });
        mockGeolocation.getCurrentPosition.mockReturnValue(undefined);

        const { result } = renderHook(() => useGeolocation());

        await act(async () => {
            result.current.startTracking();
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.position).toEqual([-60.7, -33.9]);
        expect(result.current.accuracy).toBe(8);

        // Late coarse fix must not overwrite the accurate watch fix
        const coarseSuccess = mockGeolocation.getCurrentPosition.mock.calls[0]![0] as (pos: GeolocationPosition) => void;
        act(() => {
            coarseSuccess(makePosition(-34.0, -60.8, 1500));
        });

        expect(result.current.position).toEqual([-60.7, -33.9]);
        expect(result.current.accuracy).toBe(8);
    });

    it('should stop tracking when stopTracking is called', async () => {
        const watchId = 123;
        mockGeolocation.watchPosition.mockReturnValue(watchId);

        const { result } = renderHook(() => useGeolocation());

        await act(async () => {
            result.current.startTracking();
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        act(() => {
            result.current.stopTracking();
        });

        expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(watchId);
        expect(result.current.isActive).toBe(false);
        expect(result.current.position).toBeNull();
    });

    it('should clear error and errorKind on stopTracking', async () => {
        mockGeolocation.watchPosition.mockImplementation((success, error) => {
            error(makeError(3, 'Timeout'));
            return 123;
        });

        const { result } = renderHook(() => useGeolocation());

        await act(async () => {
            result.current.startTracking();
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.error).toBe('Timeout');
        expect(result.current.errorKind).toBe('timeout');

        act(() => {
            result.current.stopTracking();
        });

        expect(result.current.error).toBeNull();
        expect(result.current.errorKind).toBeNull();
    });

    it('should clear errorKind when the watch recovers with a fix', async () => {
        let watchError: ((err: GeolocationPositionError) => void) | undefined;
        let watchSuccess: ((pos: GeolocationPosition) => void) | undefined;
        mockGeolocation.watchPosition.mockImplementation((success, error) => {
            watchSuccess = success as (pos: GeolocationPosition) => void;
            watchError = error as (err: GeolocationPositionError) => void;
            return 123;
        });

        const { result } = renderHook(() => useGeolocation());

        await act(async () => {
            result.current.startTracking();
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        act(() => {
            watchError?.(makeError(3, 'Timeout'));
        });
        expect(result.current.errorKind).toBe('timeout');

        act(() => {
            watchSuccess?.(makePosition(-33.9, -60.7, 8));
        });
        expect(result.current.error).toBeNull();
        expect(result.current.errorKind).toBeNull();
        expect(result.current.position).toEqual([-60.7, -33.9]);
    });

    it('should handle missing geolocation API', async () => {
        Object.defineProperty(globalThis.navigator, 'geolocation', {
            writable: true,
            value: undefined,
        });

        const { result } = renderHook(() => useGeolocation());

        await act(async () => {
            result.current.startTracking();
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.error).toBe('Geolocation is not supported by your browser');

    });

    it('should handle permission denied', async () => {
        Object.defineProperty(globalThis.navigator, 'permissions', {
            writable: true,
            value: {
                query: vi.fn().mockResolvedValue({ state: 'denied' }),
            },
        });

        const { result } = renderHook(() => useGeolocation());

        await act(async () => {
            result.current.startTracking();
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.error).toContain('Location permission was denied');
        expect(result.current.errorKind).toBe('denied');
        // Denied early-return must not start ANY acquisition
        expect(mockGeolocation.watchPosition).not.toHaveBeenCalled();
        expect(mockGeolocation.getCurrentPosition).not.toHaveBeenCalled();
    });

    it('should cleanup on unmount', async () => {
        const watchId = 123;
        mockGeolocation.watchPosition.mockReturnValue(watchId);

        const { result, unmount } = renderHook(() => useGeolocation());

        await act(async () => {
            result.current.startTracking();
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        unmount();

        expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(watchId);
    });
});
