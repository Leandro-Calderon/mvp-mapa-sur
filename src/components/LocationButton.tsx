import { useState, useEffect } from "react";
import "./LocationButton.css";
import { GpsDisabledModal } from "./GpsDisabledModal";
import { logger } from "../utils/logger";

interface LocationButtonProps {
  onToggle: (active: boolean) => void;
  isActive?: boolean;
  isTracking?: boolean;
  hasError?: boolean;
  errorMessage?: string | null;
}

export const LocationButton = ({
  onToggle,
  isActive: _isActive = false,
  isTracking: _isTracking = false,
  hasError = false,
  errorMessage = null
}: LocationButtonProps) => {
  const [active, setActive] = useState(_isActive);
  const [showGpsModal, setShowGpsModal] = useState(false);

  // Keep internal active state in sync with prop changes from parent
  useEffect(() => {
    setActive(_isActive);
  }, [_isActive]);

  const handleClick = () => {
    logger.debug('Location button clicked', { active });

    // When trying to activate location, check GPS status first
    if (!active) {
      logger.debug('Attempting to activate location - checking GPS status first');

      if (navigator.geolocation) {
        logger.debug('Geolocation API available, checking GPS status');

        // Check if GPS is enabled before requesting position
        checkGpsStatusAndRequest();
      } else {
        logger.error('Geolocation not supported');
        alert('La geolocalización no es compatible con tu navegador.');
      }
      return;
    }

    // Normal toggle for deactivating
    const newActive = !active;
    logger.debug('Location button new state', { newActive });
    setActive(newActive);
    onToggle(newActive);
  };

  const checkGpsStatusAndRequest = () => {
    logger.debug('Checking GPS status before requesting position');

    // First check permission status if available
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then(permissionStatus => {
        logger.debug('Current permission status', { state: permissionStatus.state });

        if (permissionStatus.state === 'denied') {
          logger.debug('Permission previously denied, showing user instructions');
          showGpsDisabledMessage();
          return;
        }

        // Permission is granted or prompt, now check if GPS is actually enabled
        // We'll use a quick getCurrentPosition call with very short timeout to check GPS status
        navigator.geolocation.getCurrentPosition(
          // Success callback - GPS is working
          () => {
            logger.debug('GPS is enabled, proceeding with full position request');
            requestPosition();
          },
          // Error callback - check if it's because GPS is disabled
          (error) => {
            logger.error('GPS status check error', error);

            if (error.code === error.POSITION_UNAVAILABLE) {
              logger.debug('GPS is turned off, showing user invitation to enable it');
              showGpsDisabledMessage();
            } else {
              // For other errors (permission denied, timeout), proceed with normal flow
              logger.debug('GPS check failed with other error, proceeding with normal request');
              requestPosition();
            }
          },
          {
            timeout: 2000, // Very short timeout just to check if GPS responds
            enableHighAccuracy: false, // Don't need high accuracy for this check
            maximumAge: 0
          }
        );
      }).catch(error => {
        logger.error('Error checking permission status', error);
        // If we can't check permissions, just try to get position
        requestPosition();
      });
    } else {
      // Permissions API not available, try to get position directly
      requestPosition();
    }
  };

  const showGpsDisabledMessage = () => {
    logger.debug('Showing GPS disabled modal');
    setShowGpsModal(true);
  };

  const closeGpsModal = () => {
    setShowGpsModal(false);
  };

  const requestPosition = () => {
    logger.debug('Requesting position');
    // Use getCurrentPosition to trigger the OS-level permission prompt
    navigator.geolocation.getCurrentPosition(
      (position) => {
        logger.debug('Successfully got position after OS prompt', position);
        // Explicitly mark active = true (don't toggle) to avoid races with parent state
        setActive(true);
        onToggle(true);
      },
      (error) => {
        logger.error('Error after OS permission prompt', error);
        logger.error('Error details', { code: error.code, message: error.message });

        // Handle specific error types
        if (error.code === error.PERMISSION_DENIED) {
          logger.debug('Permission denied by user');
          // For mobile devices, provide specific instructions
          if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            const isAndroid = /Android/i.test(navigator.userAgent);
            const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

            if (isAndroid) {
              alert('Para activar el GPS, ve a Configuración > Ubicación y activa la ubicación para esta aplicación.');
            } else if (isIOS) {
              alert('Para activar el GPS, ve a Configuración > Privacidad > Ubicación y activa la ubicación para esta aplicación.');
            }
          } else {
            alert('Por favor, habilita el GPS en la configuración de tu navegador y recarga la página.');
          }
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          logger.debug('GPS position unavailable');
          alert('No se pudo obtener tu ubicación. Asegúrate de que el GPS esté activado y tienes buena señal.');
        } else if (error.code === error.TIMEOUT) {
          logger.debug('GPS request timed out');
          alert('No se pudo obtener tu ubicación. Intenta de nuevo.');
        }

        // Do not activate the button on error; ensure it's false so UI reflects failure
        setActive(false);
        onToggle(false);
      },
      {
        timeout: 10000,
        enableHighAccuracy: true,
        // Add maximumAge to ensure fresh location request
        maximumAge: 0
      }
    );
  };

  const buttonClassName = [
    "location-btn",
    active ? "active" : "idle",
    _isTracking && !active ? "loading" : "",
    hasError ? "error" : "",
  ].filter(Boolean).join(" ");

  return (
    <>
      <button
        className={buttonClassName}
        onClick={handleClick}
        aria-label={
          hasError
            ? errorMessage || "Error de ubicación"
            : active
              ? "Desactivar ubicación"
              : "Activar ubicación"
        }
        title={
          hasError
            ? errorMessage || "Error al obtener la ubicación. Haz clic para intentar habilitar GPS"
            : active
              ? "Desactivar seguimiento de ubicación"
              : "Activar seguimiento de ubicación"
        }
      >
        <div className="location-icon">📍</div>
      </button>

      <GpsDisabledModal
        isOpen={showGpsModal}
        onClose={closeGpsModal}
      />
    </>
  );
};
