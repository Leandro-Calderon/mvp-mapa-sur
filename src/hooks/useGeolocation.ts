import { useState, useEffect, useCallback, useRef } from "react";
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

/** GPS error types that the UI needs to handle differently */
export type GpsErrorType = 'gps-disabled' | 'permission-denied' | 'timeout' | 'unavailable' | null;

export interface GpsErrorInfo {
  type: GpsErrorType;
  message: string;
}

interface GeolocationResult {
  position: LngLatArray | null;
  accuracy: number | null;
  error: GpsErrorInfo | null;
  isActive: boolean;
  isLocating: boolean;
  startTracking: () => void;
  stopTracking: () => void;
  dismissError: () => void;
}

const classifyError = (err: GeolocationPositionError): GpsErrorInfo => {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return {
        type: 'permission-denied',
        message: 'Permiso de ubicación denegado',
      };
    case err.POSITION_UNAVAILABLE:
      return {
        type: 'gps-disabled',
        message: 'GPS no disponible. Verificá que esté activado.',
      };
    case err.TIMEOUT:
      return {
        type: 'timeout',
        message: 'No se pudo obtener la ubicación. Intentá de nuevo.',
      };
    default:
      return {
        type: 'unavailable',
        message: err.message || 'Error desconocido de geolocalización',
      };
  }
};

export const useGeolocation = (): GeolocationResult => {
  const [position, setPosition] = useState<LngLatArray | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<GpsErrorInfo | null>(null);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const watchIdRef = useRef<number | null>(null);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const stopTracking = useCallback(() => {
    logger.debug('Stopping geolocation tracking');
    clearWatch();
    setPosition(null);
    setAccuracy(null);
    setIsActive(false);
    setIsLocating(false);
  }, [clearWatch]);

  const startTracking = useCallback(async () => {
    if (!navigator.geolocation) {
      setError({
        type: 'unavailable',
        message: 'Tu navegador no soporta geolocalización.',
      });
      return;
    }

    // Don't start if already active
    if (isActive) {
      logger.debug('Geolocation already active, skipping');
      return;
    }

    setIsLocating(true);
    setError(null);

    // Check permission status via Permissions API (best-effort)
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        logger.debug('Permission state', { state: permission.state });

        if (permission.state === 'denied') {
          setError({
            type: 'permission-denied',
            message: 'Permiso de ubicación denegado. Habilitá la ubicación en la configuración de tu navegador.',
          });
          setIsLocating(false);
          return;
        }
      } catch {
        // Permissions API not available or failed — proceed with direct request
        logger.debug('Permissions API check failed, proceeding with direct request');
      }
    }

    // Start watching position — this triggers the OS permission prompt if needed
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        logger.debug('Geolocation success', pos);
        setPosition([pos.coords.longitude, pos.coords.latitude]);
        setAccuracy(pos.coords.accuracy);
        setError(null);
        setIsActive(true);
        setIsLocating(false);
      },
      (err) => {
        const errorInfo = classifyError(err);
        logger.error('Geolocation error', { code: err.code, message: err.message });
        setError(errorInfo);
        setIsActive(false);
        setIsLocating(false);
        clearWatch();
      },
      GEOLOCATION_OPTIONS,
    );

    watchIdRef.current = id;
    logger.debug('Geolocation watch started', { id });
  }, [isActive, clearWatch]);

  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearWatch();
    };
  }, [clearWatch]);

  return {
    position,
    accuracy,
    error,
    isActive,
    isLocating,
    startTracking,
    stopTracking,
    dismissError,
  };
};
