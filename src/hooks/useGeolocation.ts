import { useState, useEffect, useCallback } from "react";
import type { LngLatArray } from "../types/map";
import { logger } from "../utils/logger";

interface PositionOptions {
  enableHighAccuracy?: boolean;
  maximumAge?: number;
  timeout?: number;
}

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 1000,
  timeout: 10000,
};

// Coarse-first probe: a cached/network-level fix is good enough to seed the
// map while the high-accuracy watch acquires a satellite fix.
const COARSE_FIRST_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  maximumAge: 30000,
  timeout: 8000,
};

export type GeolocationErrorKind = 'denied' | 'unavailable' | 'timeout' | 'unknown' | null;

interface GeolocationResult {
  position: LngLatArray | null;
  accuracy: number | null;
  error: string | null;
  errorKind: GeolocationErrorKind;
  isActive: boolean;
  startTracking: () => void;
  stopTracking: () => void;
}

export const useGeolocation = (): GeolocationResult => {
  const [position, setPosition] = useState<LngLatArray | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<GeolocationErrorKind>(null);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  const handleSuccess = useCallback((pos: GeolocationPosition) => {
    logger.debug('Geolocation success', pos);
    const { latitude, longitude, accuracy: positionAccuracy } = pos.coords;
    // MapLibre uses [lng, lat] (GeoJSON standard)
    logger.debug('Setting position to [lng, lat]', [longitude, latitude]);
    setPosition([longitude, latitude]);
    setAccuracy(positionAccuracy);
    setError(null);
    setErrorKind(null);
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    logger.error('Geolocation error', err);
    logger.error('Error code', { code: err.code });
    logger.error('Error message', { message: err.message });

    // Map the numeric error code to a structured kind (consumers no longer
    // need to string-match the error message), alongside the raw message.
    let kind: Exclude<GeolocationErrorKind, null> = 'unknown';
    if (err.code === err.PERMISSION_DENIED) {
      kind = 'denied';
      logger.error('GPS permission denied by user');
    } else if (err.code === err.POSITION_UNAVAILABLE) {
      kind = 'unavailable';
      logger.error('GPS position unavailable (possibly turned off)');
    } else if (err.code === err.TIMEOUT) {
      kind = 'timeout';
      logger.error('GPS request timed out');
    }

    setErrorKind(kind);
    setError(err.message);
    setPosition(null);
  }, []);

  // Coarse-first seed: sets position/accuracy ONLY while no fix exists yet.
  // It never overwrites an existing fix (the high-accuracy watch owns
  // updates) and never clears errors.
  const handleCoarseFirst = useCallback((pos: GeolocationPosition) => {
    logger.debug('Coarse-first position received', pos);
    const { latitude, longitude, accuracy: positionAccuracy } = pos.coords;
    setPosition(prev => prev ?? [longitude, latitude]);
    setAccuracy(prev => prev ?? positionAccuracy);
  }, []);

  const startTracking = useCallback(async () => {
    logger.debug('Starting geolocation tracking');
    if (!navigator.geolocation) {
      logger.error('Geolocation not supported');
      setError("Geolocation is not supported by your browser");
      return;
    }

    // Check if Permissions API is available
    if ('permissions' in navigator) {
      logger.debug('Permissions API available, checking location permission status');
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        logger.debug('Current permission state', { state: permission.state });

        if (permission.state === 'denied') {
          logger.error('Location permission previously denied');
          setErrorKind('denied');
          setError("Location permission was denied. Please enable location in your browser settings.");
          return;
        }

        if (permission.state === 'prompt') {
          logger.debug('Will prompt user for location permission');
        }
      } catch (error) {
        logger.error('Error checking permission status', error);
      }
    } else {
      logger.debug('Permissions API not available, will request permission directly');
    }

    logger.debug('Requesting geolocation permission');
    const id = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      GEOLOCATION_OPTIONS
    );

    // Coarse-first probe fired in parallel with the watch: seeds an
    // approximate position in <1s (cached/network fix) while the
    // high-accuracy watch waits for satellites. Probe errors are
    // intentionally ignored; the watch owns error reporting.
    navigator.geolocation.getCurrentPosition(
      handleCoarseFirst,
      () => {},
      COARSE_FIRST_OPTIONS
    );

    logger.debug('Geolocation watch ID', { id });
    setWatchId(id);
    setIsActive(true);
  }, [handleSuccess, handleError, handleCoarseFirst]);

  const stopTracking = useCallback(() => {
    logger.debug('Stopping geolocation tracking');
    if (watchId) {
      logger.debug('Clearing watch ID', { watchId });
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setPosition(null);
      setError(null);
      setErrorKind(null);
      setIsActive(false);
    }
  }, [watchId]);

  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return {
    position,
    accuracy,
    error,
    errorKind,
    isActive,
    startTracking,
    stopTracking,
  };
};
