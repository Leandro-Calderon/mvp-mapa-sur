import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGeolocation } from './useGeolocation';

// Helper to create mock GeolocationCoordinates with required toJSON method
const makeCoords = (lat: number, lng: number, accuracy: number): GeolocationCoordinates => ({
    latitude: lat,
    longitude: lng,
    accuracy,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
    toJSON(): GeolocationCoordinates { return this; },
});

// Helper to create mock GeolocationPosition with required toJSON method
const makePosition = (lat: number, lng: number, accuracy: number): GeolocationPosition => ({
    coords: makeCoords(lat, lng, accuracy),
    timestamp: Date.now(),
    toJSON(): GeolocationPosition { return this; },
});

describe('useGeolocation', () => {
    let mockGeolocation: {
        getCurrentPosition: ReturnType<typeof vi.fn>;
        watchPosition: ReturnType<typeof vi.fn>;
        clearWatch: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
        mockGeolocation = {
            getCurrentPosition: vi.fn(),
            watchPosition: vi.fn(),
            clearWatch: vi.fn(),
        };

        Object.defineProperty(global.navigator, 'geolocation', {
            writable: true,
            value: mockGeolocation,
        });

        Object.defineProperty(global.navigator, 'permissions', {
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
        expect(result.current.isActive).toBe(false);
        expect(result.current.isLocating).toBe(false);
    });

    it('should start tracking when startTracking is called', async () => {
        const watchId = 123;
        // Mock a successful position response so isActive gets set
        const mockPosition = makePosition(-32.93, -60.67, 50);
        mockGeolocation.watchPosition.mockImplementation((success) => {
            success(mockPosition);
            return watchId;
        });

        const { result } = renderHook(() => useGeolocation());

        await act(async () => {
            result.current.startTracking();
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(mockGeolocation.watchPosition).toHaveBeenCalled();
        expect(result.current.isActive).toBe(true);
    });

    it('should update position on successful geolocation', async () => {
        const mockPosition = makePosition(40.7128, -74.006, 10);

        mockGeolocation.watchPosition.mockImplementation((success) => {
            success(mockPosition);
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
    });

    it('should handle geolocation errors with structured error info', async () => {
        const mockError: GeolocationPositionError = {
            code: 1,
            message: 'User denied geolocation',
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
        };

        mockGeolocation.watchPosition.mockImplementation((_success, error) => {
            error(mockError);
            return 123;
        });

        const { result } = renderHook(() => useGeolocation());

        await act(async () => {
            result.current.startTracking();
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.error).not.toBeNull();
        expect(result.current.error?.type).toBe('permission-denied');
        expect(result.current.error?.message).toBeTruthy();
        expect(result.current.position).toBeNull();
        expect(result.current.isActive).toBe(false);
    });

    it('should handle POSITION_UNAVAILABLE as gps-disabled', async () => {
        const mockError: GeolocationPositionError = {
            code: 2,
            message: 'Position unavailable',
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
        };

        mockGeolocation.watchPosition.mockImplementation((_success, error) => {
            error(mockError);
            return 123;
        });

        const { result } = renderHook(() => useGeolocation());

        await act(async () => {
            result.current.startTracking();
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.error?.type).toBe('gps-disabled');
    });

    it('should handle TIMEOUT error type', async () => {
        const mockError: GeolocationPositionError = {
            code: 3,
            message: 'Timeout',
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
        };

        mockGeolocation.watchPosition.mockImplementation((_success, error) => {
            error(mockError);
            return 123;
        });

        const { result } = renderHook(() => useGeolocation());

        await act(async () => {
            result.current.startTracking();
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.error?.type).toBe('timeout');
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

    it('should handle missing geolocation API', async () => {
        Object.defineProperty(global.navigator, 'geolocation', {
            writable: true,
            value: undefined,
        });

        const { result } = renderHook(() => useGeolocation());

        await act(async () => {
            result.current.startTracking();
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.error).not.toBeNull();
        expect(result.current.error?.type).toBe('unavailable');
    });

    it('should handle permission denied from Permissions API', async () => {
        Object.defineProperty(global.navigator, 'permissions', {
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

        expect(result.current.error).not.toBeNull();
        expect(result.current.error?.type).toBe('permission-denied');
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

    it('should dismiss errors with dismissError', async () => {
        Object.defineProperty(global.navigator, 'geolocation', {
            writable: true,
            value: undefined,
        });

        const { result } = renderHook(() => useGeolocation());

        await act(async () => {
            result.current.startTracking();
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.error).not.toBeNull();

        act(() => {
            result.current.dismissError();
        });

        expect(result.current.error).toBeNull();
    });

    it('should not start tracking if already active', async () => {
        const mockPosition = makePosition(-32.93, -60.67, 50);
        mockGeolocation.watchPosition.mockImplementation((success) => {
            success(mockPosition);
            return 123;
        });

        const { result } = renderHook(() => useGeolocation());

        // First call: activates tracking
        await act(async () => {
            result.current.startTracking();
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(result.current.isActive).toBe(true);
        const callCount = mockGeolocation.watchPosition.mock.calls.length;

        // Second call: should be a no-op since already active
        await act(async () => {
            result.current.startTracking();
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(mockGeolocation.watchPosition.mock.calls.length).toBe(callCount);
    });
});
