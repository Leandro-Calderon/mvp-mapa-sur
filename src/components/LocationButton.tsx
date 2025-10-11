import { useState } from "react";
import "./LocationButton.css";

interface LocationButtonProps {
  onToggle: (active: boolean) => void;
  isActive?: boolean;
  isTracking?: boolean;
  hasError?: boolean;
  errorMessage?: string | null;
}

export const LocationButton = ({
  onToggle,
  isActive = false,
  isTracking = false,
  hasError = false,
  errorMessage = null
}: LocationButtonProps) => {
  const [active, setActive] = useState(isActive);

  const handleClick = () => {
    console.log('Location button clicked, current state:', active);
    
    // If there's an error and we're trying to activate, try to prompt for GPS
    if (hasError && !active && errorMessage) {
      console.log('GPS error detected, attempting to prompt user');
      // Try to request location permission directly
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('Successfully got position after prompt:', position);
            const newActive = !active;
            setActive(newActive);
            onToggle(newActive);
          },
          (error) => {
            console.error('Still getting error after prompt:', error);
            // Show user-friendly message based on error
            if (error.code === error.PERMISSION_DENIED) {
              alert('Por favor, habilita el GPS en la configuración de tu navegador y recarga la página.');
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              alert('El GPS está desactivado. Por favor, activa el GPS en tu dispositivo.');
            } else {
              alert('No se pudo acceder a tu ubicación. Por favor, verifica la configuración de GPS.');
            }
          },
          { timeout: 10000, enableHighAccuracy: true }
        );
      }
      return;
    }
    
    const newActive = !active;
    console.log('Location button new state:', newActive);
    setActive(newActive);
    onToggle(newActive);
  };

  const buttonClassName = [
    "location-btn",
    active ? "active" : "idle",
    hasError ? "error" : "",
  ].join(" ");

  return (
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
  );
};
