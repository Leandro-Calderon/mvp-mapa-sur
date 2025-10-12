import React from "react";
import "./App.css";
import "leaflet/dist/leaflet.css";
import { MapProvider } from "./context/MapContext";
import { MapView } from "./components/map/MapView";
import { useMapHash } from "./hooks/useMapHash";
import { ErrorBoundary } from "./components/ErrorBoundary";
// -> Importación CRÍTICA para el PWA
import { useRegisterSW } from 'virtual:pwa-register/react';


function App(): React.JSX.Element {
  const { getInitialMapState } = useMapHash();
  const initialMapState = getInitialMapState();

  // -> Inicialización del hook del Service Worker
  const {
    // needRefresh es un estado que se vuelve true si hay un nuevo SW esperando
    needRefresh: [needRefresh],
    // updateServiceWorker es la función para forzar la activación
    updateServiceWorker
  } = useRegisterSW();

  // -> Manejador para el botón de actualización
  const handleUpdate = () => {
    // El 'true' en el argumento forza a que el nuevo SW se active inmediatamente (skipWaiting).
    updateServiceWorker(true);
  };

  return (
    <ErrorBoundary>
      {/* -> ⚠️ Renderizar el banner de actualización si es necesario */}
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