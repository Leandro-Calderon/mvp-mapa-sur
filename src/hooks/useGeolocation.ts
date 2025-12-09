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

interface GeolocationResult {
  position: LngLatArray | null;
  accuracy: number | null;
  error: string | null;
  isActive: boolean;
  startTracking: () => void;
  stopTracking: () => void;
}

export const useGeolocation = (): GeolocationResult => {
  const [position, setPosition] = useState<LngLatArray | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
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
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    logger.error('Geolocation error', err);
    logger.error('Error code', { code: err.code });
    logger.error('Error message', { message: err.message });

    // Log specific error types
    switch (err.code) {
      case err.PERMISSION_DENIED:
        logger.error('GPS permission denied by user');
        break;
      case err.POSITION_UNAVAILABLE:
        logger.error('GPS position unavailable (possibly turned off)');
        break;
      case err.TIMEOUT:
        logger.error('GPS request timed out');
        break;
    }

    setError(err.message);
    setPosition(null);
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

    logger.debug('Geolocation watch ID', { id });
    setWatchId(id);
    setIsActive(true);
  }, [handleSuccess, handleError]);

  const stopTracking = useCallback(() => {
    logger.debug('Stopping geolocation tracking');
    if (watchId) {
      logger.debug('Clearing watch ID', { watchId });
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setPosition(null);
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
    isActive,
    startTracking,
    stopTracking,
  };
};
