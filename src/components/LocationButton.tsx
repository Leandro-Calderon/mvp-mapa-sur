import { useState, useEffect } from "react";
import { GpsDisabledModal } from "./GpsDisabledModal";
import type { GpsErrorInfo } from "../hooks/useGeolocation";
import { logger } from "../utils/logger";
import styles from "./LocationButton.module.css";

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
    styles.locationBtn!,
    isActive ? styles.active! : styles.idle!,
    isLocating && !isActive ? styles.loading! : "",
    error && !isActive ? styles.error! : "",
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
        <div className={styles.locationIcon!}>📍</div>
      </button>

      <GpsDisabledModal
        isOpen={showGpsModal}
        onClose={() => setShowGpsModal(false)}
        errorType={error?.type ?? 'gps-disabled'}
      />
    </>
  );
};
