import { useState, useEffect, useRef } from "react";
import "./LocationButton.css";
import { GpsDisabledModal } from "./GpsDisabledModal";
import { logger } from "../utils/logger";
import type { GeolocationErrorKind } from "../hooks/useGeolocation";

interface LocationButtonProps {
  onToggle: (active: boolean) => void;
  isActive?: boolean;
  isTracking?: boolean;
  hasError?: boolean;
  errorMessage?: string | null;
  errorKind?: GeolocationErrorKind;
}

export const LocationButton = ({
  onToggle,
  isActive: _isActive = false,
  isTracking: _isTracking = false,
  hasError = false,
  errorMessage = null,
  errorKind = null
}: LocationButtonProps) => {
  const [active, setActive] = useState(_isActive);
  const [showGpsModal, setShowGpsModal] = useState(false);
  // Set once the user activates location in this session; error UX only
  // reacts to errorKind transitions after that point.
  const activatedThisSessionRef = useRef(false);
  // Last errorKind already handled for the current activation cycle.
  const lastHandledErrorKindRef = useRef<GeolocationErrorKind>(null);

  // Keep internal active state in sync with prop changes from parent
  useEffect(() => {
    setActive(_isActive);
  }, [_isActive]);

  // Surface the hook's structured geolocation errors with the same UX the
  // old inline requestPosition handler had. Each kind is handled ONCE per
  // activation: the tracker resets when errorKind clears, and stale errors
  // present before activation never fire.
  useEffect(() => {
    if (!errorKind) {
      lastHandledErrorKindRef.current = null;
      return;
    }
    if (!activatedThisSessionRef.current) return;
    if (lastHandledErrorKindRef.current === errorKind) return;
    lastHandledErrorKindRef.current = errorKind;

    if (errorKind === 'unavailable') {
      logger.debug('GPS position unavailable after activation, showing GPS disabled modal');
      setShowGpsModal(true);
      return;
    }

    if (errorKind === 'denied') {
      logger.debug('Permission denied after activation, showing OS-specific instructions');
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
      return;
    }

    if (errorKind === 'timeout') {
      logger.debug('GPS request timed out after activation');
      alert('No se pudo obtener tu ubicación. Intenta de nuevo.');
    }
    // 'unknown': the button already reflects the error via its error styling.
  }, [errorKind]);

  const handleClick = () => {
    logger.debug('Location button clicked', { active });

    // When trying to activate location, check permission state first
    if (!active) {
      logger.debug('Attempting to activate location - checking permission state first');

      if (navigator.geolocation) {
        logger.debug('Geolocation API available, checking permission state');
        activateLocation();
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

  // Single acquisition chain: permission early-check (no acquisition), then
  // straight to activation. The OS permission prompt (when state is 'prompt')
  // and the GPS fix both come from the watchPosition started by
  // onToggle(true); there is no throwaway getCurrentPosition anymore.
  const activateLocation = () => {
    const activate = () => {
      activatedThisSessionRef.current = true;
      // Explicitly mark active = true (don't toggle) to avoid races with parent state
      setActive(true);
      onToggle(true);
    };

    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then(permissionStatus => {
        logger.debug('Current permission status', { state: permissionStatus.state });

        if (permissionStatus.state === 'denied') {
          logger.debug('Permission previously denied, showing user instructions');
          showGpsDisabledMessage();
          return;
        }

        activate();
      }).catch(error => {
        logger.error('Error checking permission status', error);
        // If we can't check permissions, activate directly; the watch
        // triggers the OS prompt itself when needed.
        activate();
      });
    } else {
      logger.debug('Permissions API not available, activating directly');
      activate();
    }
  };

  const showGpsDisabledMessage = () => {
    logger.debug('Showing GPS disabled modal');
    setShowGpsModal(true);
  };

  const closeGpsModal = () => {
    setShowGpsModal(false);
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
