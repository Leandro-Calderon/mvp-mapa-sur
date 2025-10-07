import "./App.css";
import "leaflet/dist/leaflet.css";
import { MapProvider } from "./context/MapContext";
import { MapView } from "./components/map/MapView";
import { useMapHash } from "./hooks/useMapHash";

function App(): JSX.Element {
  const { getInitialMapState } = useMapHash();
  const initialMapState = getInitialMapState();

  return (
    <MapProvider initialState={initialMapState}>
      <MapView />
    </MapProvider>
  );
}

export default App;
