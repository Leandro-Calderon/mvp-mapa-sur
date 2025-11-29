import React, { useEffect, useState } from 'react';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import './ConnectionStatus.css';

interface ConnectionStatusProps {
  showCacheInfo?: boolean;
  cacheInfo?: {
    buildings: boolean;
    streets: boolean;
    lastSync?: number;
  };
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  showCacheInfo = false,
  cacheInfo
}) => {
  const { isOnline, isOffline, networkQuality, effectiveType } = useConnectionStatus();
  const [isVisible, setIsVisible] = useState(true);
  const [hasBeenHidden, setHasBeenHidden] = useState(false);
  const [previousOnlineStatus, setPreviousOnlineStatus] = useState(() => {
    // Initialize with the current online status to avoid false positives on mount
    return navigator.onLine;
  });
  const [isShowingForStatusChange, setIsShowingForStatusChange] = useState(false);

  // Auto-hide after 3 seconds on initial mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setHasBeenHidden(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Show again when connection status actually changes (online/offline toggle)
  useEffect(() => {
    // Skip if we haven't been hidden yet (initial show period)
    if (!hasBeenHidden) {
      return undefined;
    }

    // Only show if connection status changed from previous state and we're not already showing
    if (previousOnlineStatus !== isOnline && !isShowingForStatusChange) {
      setIsVisible(true);
      setPreviousOnlineStatus(isOnline);
      setIsShowingForStatusChange(true);

      // Hide again after 3 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsShowingForStatusChange(false);
      }, 3000);

      return () => {
        clearTimeout(timer);
        setIsShowingForStatusChange(false);
      };
    }

    return undefined;
  }, [isOnline, previousOnlineStatus, hasBeenHidden, isShowingForStatusChange]);

  const getNetworkQualityIcon = () => {
    if (isOffline) return '📴';
    switch (networkQuality) {
      case 'fast': return '🚀';
      case 'medium': return '📶';
      case 'slow': return '🐌';
      default: return '❓';
    }
  };

  const getNetworkQualityText = () => {
    if (isOffline) return 'Sin conexión';
    switch (networkQuality) {
      case 'fast': return 'Conexión rápida';
      case 'medium': return 'Conexión media';
      case 'slow': return 'Conexión lenta';
      default: return 'Calidad desconocida';
    }
  };

  const formatLastSync = (timestamp?: number) => {
    if (!timestamp) return 'Nunca';

    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    return 'Ahora mismo';
  };

  return isVisible ? (
    <div className={`connection-status ${isOffline ? 'offline' : 'online'}`}>
      <div className="connection-indicator">
        <span className="connection-icon">{getNetworkQualityIcon()}</span>
        <span className="connection-text">{getNetworkQualityText()}</span>
        {effectiveType && (
          <span className="connection-type">({effectiveType})</span>
        )}
      </div>

      {showCacheInfo && cacheInfo && (
        <div className="cache-info">
          <div className="cache-status">
            <span className={`cache-indicator ${cacheInfo.buildings ? 'cached' : 'not-cached'}`}>
              🏢 Edificios: {cacheInfo.buildings ? '✅' : '❌'}
            </span>
            <span className={`cache-indicator ${cacheInfo.streets ? 'cached' : 'not-cached'}`}>
              🛣️ Calles: {cacheInfo.streets ? '✅' : '❌'}
            </span>
          </div>
          {cacheInfo.lastSync && (
            <div className="last-sync">
              Última sincronización: {formatLastSync(cacheInfo.lastSync)}
            </div>
          )}
        </div>
      )}
    </div>
  ) : null;
};