import React, { useState } from "react";
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
  isActive: _isActive = false,
  isTracking: _isTracking = false,
  hasError = false,
  errorMessage = null
}: LocationButtonProps) => {
  const [active, setActive] = useState(_isActive);

  const handleClick = () => {
    console.log('Location button clicked, current state:', active);

    // When trying to activate location, always trigger the OS permission prompt
    if (!active) {
      console.log('Attempting to activate location - triggering OS permission prompt');

      if (navigator.geolocation) {
        // Use getCurrentPosition to trigger the OS-level permission prompt
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('Successfully got position after OS prompt:', position);
            const newActive = !active;
            setActive(newActive);
            onToggle(newActive);
          },
          (error) => {
            console.error('Error after OS permission prompt:', error);
            console.log('OS permission prompt was shown but user denied or GPS is disabled');

            // Don't show browser alerts - let the OS handle the notification
            // The OS has already shown its native permission/GPS dialog
            console.log('OS notification shown to user - no browser alert needed');

            // Still toggle the button state to let the parent handle the error
            const newActive = !active;
            setActive(newActive);
            onToggle(newActive);
          },
          {
            timeout: 10000,
            enableHighAccuracy: true,
            // Add maximumAge to ensure fresh location request
            maximumAge: 0
          }
        );
      } else {
        console.error('Geolocation not supported');
        alert('La geolocalización no es compatible con tu navegador.');
      }
      return;
    }

    // Normal toggle for deactivating
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
