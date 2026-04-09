import React from "react";
import type { GpsErrorType } from "../hooks/useGeolocation";
import "./GpsDisabledModal.css";

interface GpsDisabledModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorType?: GpsErrorType;
}

export const GpsDisabledModal: React.FC<GpsDisabledModalProps> = ({ isOpen, onClose, errorType = 'gps-disabled' }) => {
  if (!isOpen) return null;

  const isAndroid = /Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  const getTitle = () => {
    switch (errorType) {
      case 'permission-denied':
        return 'Permiso Denegado';
      case 'gps-disabled':
        return 'GPS Desactivado';
      case 'timeout':
        return 'Ubicación no Disponible';
      default:
        return 'Error de Ubicación';
    }
  };

  const getIntro = () => {
    switch (errorType) {
      case 'permission-denied':
        return 'Esta aplicación necesita acceso a tu ubicación para mostrar puntos de interés cercanos. Habilitá el permiso para continuar.';
      case 'gps-disabled':
        return 'Para obtener tu ubicación actual y mostrar los puntos de interés cercanos, necesitás activar el GPS en tu dispositivo.';
      case 'timeout':
        return 'No se pudo obtener tu ubicación a tiempo. Esto puede deberse a una señal GPS débil o a que estás en un lugar cerrado.';
      default:
        return 'Ocurrió un error al intentar obtener tu ubicación. Verificá la configuración de tu dispositivo.';
    }
  };

  const getInstructions = () => {
    if (errorType === 'permission-denied') {
      if (isAndroid) {
        return (
          <div className="instructions">
            <p>Para habilitar el permiso en Android:</p>
            <ol>
              <li>Ve a <strong>Configuración</strong> de tu dispositivo</li>
              <li>Busca <strong>Aplicaciones</strong> → encontrá esta app</li>
              <li>Toca <strong>Permisos</strong> → <strong>Ubicación</strong></li>
              <li>Seleccioná <strong>Permitir solo mientras se usa la app</strong></li>
              <li>Volvé y presioná el botón de ubicación nuevamente</li>
            </ol>
          </div>
        );
      }
      if (isIOS) {
        return (
          <div className="instructions">
            <p>Para habilitar el permiso en iOS:</p>
            <ol>
              <li>Ve a <strong>Configuración</strong></li>
              <li>Seleccioná <strong>Privacidad y seguridad</strong> → <strong>Ubicación</strong></li>
              <li>Buscá esta aplicación en la lista</li>
              <li>Cambiá el acceso a <strong>Mientras uso la app</strong></li>
              <li>Volvé y presioná el botón de ubicación nuevamente</li>
            </ol>
          </div>
        );
      }
      return (
        <div className="instructions">
          <p>Para habilitar el permiso en tu navegador:</p>
          <ol>
            <li>Buscá el ícono de ubicación <strong>📍</strong> o candado en la barra de direcciones</li>
            <li>Hacé clic y seleccioná <strong>Permitir</strong> o <strong>Restablecer permiso</strong></li>
            <li>Si no aparece, verificá la configuración de privacidad del navegador</li>
            <li>Recargá la página y presioná el botón de ubicación nuevamente</li>
          </ol>
        </div>
      );
    }

    // GPS disabled instructions
    if (isAndroid) {
      return (
        <div className="instructions">
          <p>Para activar el GPS en tu dispositivo Android:</p>
          <ol>
            <li>Ve a <strong>Configuración</strong> de tu dispositivo</li>
            <li>Buscá y seleccioná <strong>Ubicación</strong></li>
            <li>Activá la opción <strong>Usar ubicación</strong></li>
            <li>Volvé a la aplicación y presioná el botón de ubicación nuevamente</li>
          </ol>
        </div>
      );
    }
    if (isIOS) {
      return (
        <div className="instructions">
          <p>Para activar el GPS en tu dispositivo iOS:</p>
          <ol>
            <li>Ve a <strong>Configuración</strong></li>
            <li>Seleccioná <strong>Privacidad y seguridad</strong></li>
            <li>Seleccioná <strong>Ubicación</strong></li>
            <li>Asegurate de que la ubicación esté activa</li>
            <li>Buscá esta aplicación en la lista y permití el acceso</li>
            <li>Volvé y presioná el botón de ubicación nuevamente</li>
          </ol>
        </div>
      );
    }
    return (
      <div className="instructions">
        <p>Para activar el GPS en tu navegador:</p>
        <ol>
          <li>Buscá el ícono de ubicación o candado en la barra de direcciones</li>
          <li>Hacé clic en él y seleccioná <strong>Permitir</strong> o <strong>Solicitar acceso</strong></li>
          <li>Si no aparece, verificá la configuración de privacidad de tu navegador</li>
          <li>Recargá la página y presioná el botón de ubicación nuevamente</li>
        </ol>
      </div>
    );
  };

  return (
    <div className="gps-modal-overlay" onClick={onClose}>
      <div className="gps-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="gps-modal-header">
          <div className="gps-icon">📍</div>
          <h2>{getTitle()}</h2>
        </div>

        <div className="gps-modal-body">
          <p className="gps-message">{getIntro()}</p>
          {getInstructions()}

          <div className="gps-modal-footer">
            <button className="gps-modal-button primary" onClick={onClose}>
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
