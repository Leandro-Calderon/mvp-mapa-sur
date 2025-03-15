import { useState, useEffect, useCallback } from "react";

const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 1000,
  timeout: 10000,
};

export const useGeolocation = () => {
  const [position, setPosition] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [error, setError] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const [watchId, setWatchId] = useState(null);

  const handleSuccess = useCallback((pos) => {
    const { latitude, longitude, accuracy } = pos.coords;
    setPosition([latitude, longitude]);
    setAccuracy(accuracy);
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
    accuracy,
    error,
    isActive,
    startTracking,
    stopTracking,
  };
};
