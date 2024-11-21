import "./App.css";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { Layers } from "./components/Layers.jsx";
import LiveLocationToggle from "./components/LiveLocationToggle.jsx";
import PWABadge from "./PWABadge.jsx";

const updateHash = (map) => {
  const zoom = map.getZoom();
  const center = map.getCenter();
  const { lat, lng } = center;

  // Actualizar la URL con el hash
  window.location.hash = `#map=${zoom}/${lat.toFixed(5)}/${lng.toFixed(5)}`;
};

function MapComponent() {
  const map = useMap();

  useEffect(() => {
    const onMoveEnd = () => updateHash(map);
    map.on("moveend", onMoveEnd);
    return () => {
      map.off("moveend", onMoveEnd);
    };
  }, [map]);

  return null;
}

function App() {
  const [mapState, setMapState] = useState({
    zoom: 9,
    center: [-32.939, -60.59372],
  });

  // Leer el hash de la URL cuando se carga el componente
  useEffect(() => {
    if (window.location.hash) {
      const [zoom, lat, lng] = window.location.hash
        .replace("#map=", "")
        .split("/")
        .map(Number);
      if (zoom && lat && lng) {
        setMapState({ zoom, center: [lat, lng] });
      }
    }
  }, []);

  return (
    <MapContainer
      center={mapState.center}
      zoom={mapState.zoom}
      zoomControl={false}
      scrollWheelZoom={true}
      style={{ height: "100vh", width: "100vw" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapComponent />
      <PWABadge />
      <Layers />
      <LiveLocationToggle />
    </MapContainer>
  );
}

export default App;
