import React, { useState, useEffect } from "react";
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

  // Keep internal active state in sync with prop changes from parent
  useEffect(() => {
    setActive(_isActive);
  }, [_isActive]);

  const handleClick = () => {
    console.log('Location button clicked, current state:', active);

    // When trying to activate location, check GPS status first
    if (!active) {
      console.log('Attempting to activate location - checking GPS status first');

      if (navigator.geolocation) {
        console.log('Geolocation API available, checking GPS status...');

        // Check if GPS is enabled before requesting position
        checkGpsStatusAndRequest();
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

  const checkGpsStatusAndRequest = () => {
    console.log('Checking GPS status before requesting position...');

    // First check permission status if available
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then(permissionStatus => {
        console.log('Current permission status:', permissionStatus.state);

        if (permissionStatus.state === 'denied') {
          console.log('Permission previously denied, showing user instructions');
          showGpsDisabledMessage();
          return;
        }

        // Permission is granted or prompt, now check if GPS is actually enabled
        // We'll use a quick getCurrentPosition call with very short timeout to check GPS status
        navigator.geolocation.getCurrentPosition(
          // Success callback - GPS is working
          () => {
            console.log('GPS is enabled, proceeding with full position request');
            requestPosition();
          },
          // Error callback - check if it's because GPS is disabled
          (error) => {
            console.error('GPS status check error:', error);

            if (error.code === error.POSITION_UNAVAILABLE) {
              console.log('GPS is turned off, showing user invitation to enable it');
              showGpsDisabledMessage();
            } else {
              // For other errors (permission denied, timeout), proceed with normal flow
              console.log('GPS check failed with other error, proceeding with normal request');
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
        console.error('Error checking permission status:', error);
        // If we can't check permissions, just try to get position
        requestPosition();
      });
    } else {
      // Permissions API not available, try to get position directly
      requestPosition();
    }
  };

  const showGpsDisabledMessage = () => {
    console.log('Showing GPS disabled popup message');

    // For mobile devices, provide specific instructions
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (isAndroid) {
        const shouldOpenSettings = window.confirm(
          'El GPS está desactivado. ¿Deseas activar el GPS para obtener tu ubicación actual?'
        );

        if (shouldOpenSettings) {
          console.log('Android device detected, attempting to open location settings');
          window.open('intent://settings#Intent;scheme=android.settings;action=android.settings.LOCATION_SOURCE_SETTINGS;end', '_blank');
        }
      } else if (isIOS) {
        alert('Para activar el GPS, ve a Configuración > Privacidad > Ubicación y activa la ubicación para esta aplicación.');
      }
    } else {
      const shouldEnableGps = window.confirm(
        'El GPS está desactivado. ¿Deseas habilitar el GPS en tu navegador para obtener tu ubicación?'
      );

      if (shouldEnableGps) {
        alert('Por favor, habilita el GPS en la configuración de tu navegador y recarga la página.');
      }
    }
  };

  const requestPosition = () => {
    console.log('Requesting position...');
    // Use getCurrentPosition to trigger the OS-level permission prompt
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Successfully got position after OS prompt:', position);
        // Explicitly mark active = true (don't toggle) to avoid races with parent state
        setActive(true);
        onToggle(true);
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
          console.log('GPS position unavailable (this shouldn\'t happen after our check)');
          alert('No se pudo obtener tu ubicación. Asegúrate de que el GPS esté activado y tienes buena señal.');
        } else if (error.code === error.TIMEOUT) {
          console.log('GPS request timed out');
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
