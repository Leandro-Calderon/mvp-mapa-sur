import React from "react";
import "./GpsDisabledModal.css";

interface GpsDisabledModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GpsDisabledModal: React.FC<GpsDisabledModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const isAndroid = /Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const getInstructions = () => {
    if (isAndroid) {
      return (
        <div className="instructions">
          <p>Para activar el GPS en tu dispositivo Android:</p>
          <ol>
            <li>Ve a <strong>Configuración</strong> de tu dispositivo</li>
            <li>Busca y selecciona <strong>Ubicación</strong></li>
            <li>Activa la opción <strong>Usar ubicación</strong></li>
            <li>Vuelve a la aplicación y presiona el botón de ubicación nuevamente</li>
          </ol>
        </div>
      );
    } else if (isIOS) {
      return (
        <div className="instructions">
          <p>Para activar el GPS en tu dispositivo iOS:</p>
          <ol>
            <li>Ve a <strong>Configuración</strong></li>
            <li>Selecciona <strong>Privacidad y seguridad</strong></li>
            <li>Selecciona <strong>Ubicación</strong></li>
            <li>Asegúrate de que la ubicación esté activa</li>
            <li>Busca esta aplicación en la lista y permite el acceso</li>
            <li>Vuelve a la aplicación y presiona el botón de ubicación nuevamente</li>
          </ol>
        </div>
      );
    } else {
      return (
        <div className="instructions">
          <p>Para activar el GPS en tu navegador:</p>
          <ol>
            <li>Busca el ícono de ubicación o candado en la barra de direcciones</li>
            <li>Haz clic en él y selecciona <strong>Permitir</strong> o <strong>Solicitar acceso</strong></li>
            <li>Si no aparece, verifica la configuración de privacidad de tu navegador</li>
            <li>Recarga la página y presiona el botón de ubicación nuevamente</li>
          </ol>
        </div>
      );
    }
  };

  return (
    <div className="gps-modal-overlay" onClick={onClose}>
      <div className="gps-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="gps-modal-header">
          <div className="gps-icon">📍</div>
          <h2>GPS Desactivado</h2>
        </div>

        <div className="gps-modal-body">
          <p className="gps-message">
            Para obtener tu ubicación actual y mostrar los puntos de interés cercanos,
            necesitas activar el GPS en tu dispositivo.
          </p>

          {getInstructions()}

          <div className="gps-modal-footer">
            <button
              className="gps-modal-button primary"
              onClick={onClose}
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};