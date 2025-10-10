import { useState, useEffect, useCallback } from "react";
import type { LatLngArray } from "../types/map";

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 1000,
  timeout: 10000,
};

interface GeolocationResult {
  position: LatLngArray | null;
  accuracy: number | null;
  error: string | null;
  isActive: boolean;
  startTracking: () => void;
  stopTracking: () => void;
}

export const useGeolocation = (): GeolocationResult => {
  const [position, setPosition] = useState<LatLngArray | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  const handleSuccess = useCallback((pos: GeolocationPosition) => {
    console.log('Geolocation success:', pos);
    const { latitude, longitude, accuracy: positionAccuracy } = pos.coords;
    console.log('Setting position to:', [latitude, longitude]);
    setPosition([latitude, longitude]);
    setAccuracy(positionAccuracy);
    setError(null);
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    console.error('Geolocation error:', err);
    setError(err.message);
    setPosition(null);
  }, []);

  const startTracking = useCallback(() => {
    console.log('Starting geolocation tracking...');
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      setError("Geolocation is not supported by your browser");
      return;
    }

    console.log('Requesting geolocation permission...');
    const id = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      GEOLOCATION_OPTIONS
    );

    console.log('Geolocation watch ID:', id);
    setWatchId(id);
    setIsActive(true);
  }, [handleSuccess, handleError]);

  const stopTracking = useCallback(() => {
    console.log('Stopping geolocation tracking...');
    if (watchId) {
      console.log('Clearing watch ID:', watchId);
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
