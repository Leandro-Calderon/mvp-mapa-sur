import { useState, useEffect, useCallback } from "react";

const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 10000,
  timeout: 5000,
};

export const useGeolocation = () => {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [watchId, setWatchId] = useState(null);

  const handleSuccess = useCallback((pos) => {
    const { latitude, longitude } = pos.coords;
    setPosition([latitude, longitude]);
    setError(null);
  }, []);

  const handleError = useCallback((err) => {
    setError(err.message);
    setPosition(null);
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    const id = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      GEOLOCATION_OPTIONS
    );

    setWatchId(id);
    setIsActive(true);
  }, [handleSuccess, handleError]);

  const stopTracking = useCallback(() => {
    if (watchId) {
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
    error,
    isActive,
    startTracking,
    stopTracking,
  };
};
