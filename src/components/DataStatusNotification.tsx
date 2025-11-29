import React from 'react';
import type { EnhancedDataServiceResult } from '../hooks/useDataService';
import './DataStatusNotification.css';

interface DataStatusNotificationProps {
  buildings: EnhancedDataServiceResult<any[]>;
  streets: EnhancedDataServiceResult<any[]>;
  onRefresh?: () => void;
}

export const DataStatusNotification: React.FC<DataStatusNotificationProps> = ({
  buildings,
  streets,
  onRefresh
}) => {
  // Don't show if loading or no data
  if (buildings.loading || streets.loading) {
    return null;
  }

  // Don't show if no errors and fresh data
  if (!buildings.error && !streets.error && !buildings.isStale && !streets.isStale) {
    return null;
  }

  const hasStaleData = buildings.isStale || streets.isStale;
  const hasCacheData = buildings.fromCache || streets.fromCache;
  const hasErrors = !!buildings.error || !!streets.error;

  const getMessage = () => {
    if (hasErrors) {
      return {
        type: 'error' as const,
        icon: '❌',
        text: 'Error al cargar datos',
        subtext: 'Verifica tu conexión e intenta nuevamente'
      };
    }

    if (hasStaleData && hasCacheData) {
      return {
        type: 'warning' as const,
        icon: '⚠️',
        text: 'Datos desactualizados',
        subtext: 'Mostrando datos en caché. Conéctate a internet para actualizar.'
      };
    }

    if (hasCacheData) {
      return {
        type: 'info' as const,
        icon: '💾',
        text: 'Modo offline',
        subtext: 'Usando datos guardados localmente'
      };
    }

    return null;
  };

  const message = getMessage();
  if (!message) return null;

  return (
    <div className={`data-status-notification ${message.type}`}>
      <div className="notification-content">
        <span className="notification-icon">{message.icon}</span>
        <div className="notification-text">
          <div className="notification-title">{message.text}</div>
          {message.subtext && (
            <div className="notification-subtitle">{message.subtext}</div>
          )}
        </div>
        {onRefresh && (
          <button
            className="refresh-button"
            onClick={onRefresh}
            disabled={buildings.loading || streets.loading}
          >
            🔄 Actualizar
          </button>
        )}
      </div>
    </div>
  );
};