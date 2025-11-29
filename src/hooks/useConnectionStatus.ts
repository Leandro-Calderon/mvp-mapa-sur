import { useState, useEffect } from 'react';
import { connectionService, type ConnectionStatus } from '../services/ConnectionService';

export const useConnectionStatus = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    connectionService.getConnectionStatus()
  );

  useEffect(() => {
    const unsubscribe = connectionService.addListener(setConnectionStatus);

    return unsubscribe;
  }, []);

  return {
    ...connectionStatus,
    isOnline: connectionStatus.isOnline,
    isOffline: !connectionStatus.isOnline,
    networkQuality: connectionService.getNetworkQuality(),
    shouldUseOfflineFirst: connectionService.shouldUseOfflineFirst()
  };
};