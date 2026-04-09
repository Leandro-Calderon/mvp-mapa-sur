import { useEffect, useState } from "react";
import type { EnhancedDataServiceResult } from "../hooks/useDataService";
import { useConnectionStatus } from "../hooks/useConnectionStatus";
import "./ConnectionStatus.css";

interface ConnectionStatusProps {
  buildings: EnhancedDataServiceResult<any[]>;
  streets: EnhancedDataServiceResult<any[]>;
  onRefresh?: () => void;
}

export const ConnectionStatus = ({
  buildings,
  streets,
  onRefresh,
}: ConnectionStatusProps) => {
  const { isOnline, isOffline, networkQuality, effectiveType } =
    useConnectionStatus();
  const [isVisible, setIsVisible] = useState(true);
  const [hasBeenHidden, setHasBeenHidden] = useState(false);
  const [previousOnlineStatus, setPreviousOnlineStatus] = useState(
    () => navigator.onLine
  );
  const [isShowingForStatusChange, setIsShowingForStatusChange] =
    useState(false);

  const isLoading = buildings.loading || streets.loading;
  const hasErrors = !!buildings.error || !!streets.error;
  const hasStaleData = buildings.isStale || streets.isStale;
  const hasCacheData = buildings.fromCache || streets.fromCache;

  // Auto-hide after 4 seconds on initial mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setHasBeenHidden(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  // Show again when connection status changes
  useEffect(() => {
    if (!hasBeenHidden) return undefined;

    if (previousOnlineStatus !== isOnline && !isShowingForStatusChange) {
      setIsVisible(true);
      setPreviousOnlineStatus(isOnline);
      setIsShowingForStatusChange(true);

      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsShowingForStatusChange(false);
      }, 4000);

      return () => {
        clearTimeout(timer);
        setIsShowingForStatusChange(false);
      };
    }

    return undefined;
  }, [isOnline, previousOnlineStatus, hasBeenHidden, isShowingForStatusChange]);

  // ─── Determine what to show ────────────────────────────────
  // Priority: loading > errors > offline > stale > online

  const getNetworkIcon = () => {
    if (isOffline) return "📴";
    switch (networkQuality) {
      case "fast": return "🚀";
      case "medium": return "📶";
      case "slow": return "🐌";
      default: return "❓";
    }
  };

  const getNetworkText = () => {
    if (isOffline) return "Sin conexión";
    switch (networkQuality) {
      case "fast": return "Conexión rápida";
      case "medium": return "Conexión media";
      case "slow": return "Conexión lenta";
      default: return "Conectado";
    }
  };

  const formatLastSync = (timestamp?: number) => {
    if (!timestamp) return null;
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `Hace ${days}d`;
    if (hours > 0) return `Hace ${hours}h`;
    if (minutes > 0) return `Hace ${minutes}m`;
    return "Ahora";
  };

  const getType = (): "error" | "warning" | "info" | "success" => {
    if (hasErrors) return "error";
    if (isOffline || hasStaleData) return "warning";
    if (hasCacheData) return "info";
    return "success";
  };

  const cacheInfo = {
    buildings: buildings.data.length > 0,
    streets: streets.data.length > 0,
    lastSync: buildings.lastUpdated ?? streets.lastUpdated,
  };

  // Don't render if loading or if everything is fine and already hidden
  if (isLoading) return null;

  return isVisible ? (
    <div className={`connection-status ${getType()}`}>
      <div className="cs-row">
        <span className="cs-icon">{getNetworkIcon()}</span>
        <span className="cs-text">{getNetworkText()}</span>
        {effectiveType && (
          <span className="cs-type">({effectiveType})</span>
        )}
      </div>

      {/* Data status — replaces old DataStatusNotification */}
      {hasErrors && (
        <div className="cs-detail">
          Error al cargar datos. Verificá tu conexión.
          {onRefresh && (
            <button
              className="cs-refresh"
              onClick={onRefresh}
              disabled={isLoading}
            >
              🔄 Reintentar
            </button>
          )}
        </div>
      )}

      {hasStaleData && hasCacheData && !hasErrors && (
        <div className="cs-detail">
          Datos desactualizados — usando caché
          {onRefresh && (
            <button
              className="cs-refresh"
              onClick={onRefresh}
              disabled={isLoading}
            >
              🔄 Actualizar
            </button>
          )}
        </div>
      )}

      {!hasErrors && !hasStaleData && hasCacheData && (
        <div className="cs-detail">Usando datos guardados localmente</div>
      )}

      {/* Cache indicators */}
      <div className="cs-cache">
        <span className={cacheInfo.buildings ? "cs-ok" : "cs-missing"}>
          🏢 {cacheInfo.buildings ? "✓" : "…"}
        </span>
        <span className={cacheInfo.streets ? "cs-ok" : "cs-missing"}>
          🛣️ {cacheInfo.streets ? "✓" : "…"}
        </span>
        {cacheInfo.lastSync && (
          <span className="cs-sync">{formatLastSync(cacheInfo.lastSync)}</span>
        )}
      </div>
    </div>
  ) : null;
};
