import "./App.css";
import "leaflet/dist/leaflet.css";
import { MapProvider } from "./context/MapContext";
import { MapView } from "./components/map/MapView";
import { useMapHash } from "./hooks/useMapHash";
import { ErrorBoundary } from "./components/ErrorBoundary";

function App(): JSX.Element {
  const { getInitialMapState } = useMapHash();
  const initialMapState = getInitialMapState();

  return (
    <ErrorBoundary>
      <MapProvider initialState={initialMapState}>
        <MapView />
      </MapProvider>
    </ErrorBoundary>
  );
}

export default App;
