import { useState, useEffect } from "react";
import "./LocationButton.css";
import { GpsDisabledModal } from "./GpsDisabledModal";
import type { GpsErrorInfo } from "../hooks/useGeolocation";
import { logger } from "../utils/logger";

interface LocationButtonProps {
  onToggle: (active: boolean) => void;
  isActive?: boolean;
  isLocating?: boolean;
  error?: GpsErrorInfo | null;
}

export const LocationButton = ({
  onToggle,
  isActive = false,
  isLocating = false,
  error = null,
}: LocationButtonProps) => {
  const [showGpsModal, setShowGpsModal] = useState(false);

  // Show modal when a GPS error arrives that requires user intervention
  useEffect(() => {
    if (error && (error.type === 'gps-disabled' || error.type === 'permission-denied')) {
      setShowGpsModal(true);
    }
  }, [error]);

  const handleClick = () => {
    if (isActive) {
      logger.debug('Location button: deactivating');
      onToggle(false);
    } else {
      logger.debug('Location button: requesting activation');
      onToggle(true);
    }
  };

  const buttonClassName = [
    "location-btn",
    isActive ? "active" : "idle",
    isLocating && !isActive ? "loading" : "",
    error && !isActive ? "error" : "",
  ].filter(Boolean).join(" ");

  return (
    <>
      <button
        className={buttonClassName}
        onClick={handleClick}
        aria-label={
          error
            ? error.message
            : isActive
              ? "Desactivar ubicación"
              : "Activar ubicación"
        }
        title={
          error
            ? error.message
            : isActive
              ? "Desactivar seguimiento de ubicación"
              : "Activar seguimiento de ubicación"
        }
      >
        <div className="location-icon">📍</div>
      </button>

      <GpsDisabledModal
        isOpen={showGpsModal}
        onClose={() => setShowGpsModal(false)}
        errorType={error?.type ?? 'gps-disabled'}
      />
    </>
  );
};
