import "./App.css";
import "leaflet/dist/leaflet.css";
import { MapProvider } from "./context/MapContext.jsx";
import { MapView } from "./components/map/MapView.jsx";
import { useMapHash } from "./hooks/useMapHash.js";

function App() {
    const { getInitialMapState } = useMapHash();
    const initialMapState = getInitialMapState();

    return (
        <MapProvider initialState={initialMapState}>
            <MapView />
        </MapProvider>
    );
}

export default App;
