import React from "react";
import "./App.css";
import { MapProvider } from "./context/MapContext";
import { MapView } from "./components/map/MapView";
import { useMapHash } from "./hooks/useMapHash";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useRegisterSW } from 'virtual:pwa-register/react';

function App(): React.JSX.Element {
  const { getInitialMapState } = useMapHash();
  const initialMapState = getInitialMapState();
  const {
    needRefresh: [needRefresh],

    updateServiceWorker
  } = useRegisterSW();

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  return (
    <ErrorBoundary>

      {needRefresh && (
        <div className="pwa-update-banner">
          <span>¡Nueva versión disponible!</span>
          <button onClick={handleUpdate}>
            Actualizar y Recargar
          </button>
        </div>
      )}

      <MapProvider initialState={initialMapState}>
        <MapView />
      </MapProvider>
    </ErrorBoundary>
  );
}

export default App;