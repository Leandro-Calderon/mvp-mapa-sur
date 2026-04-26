import React from "react";
import "./App.css";
import { MapProvider } from "./context/MapContext";
import { MapView } from "./components/map/MapView";
import { useMapHash } from "./hooks/useMapHash";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useRegisterSW } from "virtual:pwa-register/react";

function App(): React.JSX.Element {
  const { getInitialMapState } = useMapHash();
  const initialMapState = getInitialMapState();
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      // Poll for SW updates every 60 minutes while the tab is open.
      // This ensures the "new version" banner appears promptly after
      // a deploy, even if the user keeps the tab open for hours.
      if (registration) {
        setInterval(() => registration.update(), 60 * 60 * 1000);
      }
    },
  });

  const handleUpdate = async () => {
    // updateServiceWorker(true) sends SKIP_WAITING to the SW,
    // then reloads the page. Since clientsClaim is disabled, the
    // reload is what actually activates the new SW for this page.
    await updateServiceWorker(true);
  };

  return (
    <ErrorBoundary>
      {needRefresh && (
        <div className="pwa-update-banner">
          <span>¡Nueva versión disponible!</span>
          <button onClick={handleUpdate}>Actualizar y Recargar</button>
        </div>
      )}

      <MapProvider initialState={initialMapState}>
        <MapView />
      </MapProvider>
    </ErrorBoundary>
  );
}

export default App;
