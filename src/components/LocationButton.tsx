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
        console.log('Geolocation API available, requesting position...');

        // First check permission status if available
        if ('permissions' in navigator) {
          navigator.permissions.query({ name: 'geolocation' }).then(permissionStatus => {
            console.log('Current permission status:', permissionStatus.state);

            if (permissionStatus.state === 'denied') {
              console.log('Permission previously denied, showing user instructions');
              // For mobile devices, try to open location settings
              if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                // Try to open location settings for mobile devices
                const isAndroid = /Android/i.test(navigator.userAgent);
                const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

                if (isAndroid) {
                  console.log('Android device detected, attempting to open location settings');
                  // For Android, try to open location settings
                  window.open('intent://settings#Intent;scheme=android.settings;action=android.settings.LOCATION_SOURCE_SETTINGS;end', '_blank');
                } else if (isIOS) {
                  console.log('iOS device detected, showing instructions for settings');
                  // For iOS, we can't programmatically open settings, so show instructions
                  alert('Para activar el GPS, ve a Configuración > Privacidad > Ubicación y activa la ubicación para esta aplicación.');
                }
              } else {
                alert('Por favor, habilita el GPS en la configuración de tu navegador y recarga la página.');
              }
            } else {
              // Permission not denied, try to get position
              requestPosition();
            }
          }).catch(error => {
            console.error('Error checking permission status:', error);
            requestPosition();
          });
        } else {
          // Permissions API not available, directly request position
          requestPosition();
        }
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

  const requestPosition = () => {
    console.log('Requesting position...');
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
        console.log('Error code:', error.code);
        console.log('Error message:', error.message);

        // Handle specific error types
        if (error.code === error.PERMISSION_DENIED) {
          console.log('Permission denied by user');
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
          console.log('GPS position unavailable (possibly turned off)');
          alert('El GPS está desactivado. Por favor, activa el GPS en tu dispositivo.');
        } else if (error.code === error.TIMEOUT) {
          console.log('GPS request timed out');
          alert('No se pudo obtener tu ubicación. Intenta de nuevo.');
        }

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
