import "./App.css";
import "leaflet/dist/leaflet.css";
import { useEffect, useState, useRef, useContext } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { Layers } from "./components/Layers.jsx";
import LiveLocationToggle from "./components/LiveLocationToggle.jsx";
import PWABadge from "./PWABadge.jsx";
import React from "react";

// Extract URL hash logic into a custom hook
function useMapHash() {
  const updateMapHash = (map) => {
    const zoom = map.getZoom();
    const center = map.getCenter();
    const { lat, lng } = center;
    window.location.hash = `#map=${zoom}/${lat.toFixed(5)}/${lng.toFixed(5)}`;
  };
  
  const getInitialMapState = () => {
    const defaultState = { zoom: 9, center: [-32.939, -60.59372] };
    
    if (!window.location.hash) return defaultState;
    
    try {
      const [zoom, lat, lng] = window.location.hash
        .replace("#map=", "")
        .split("/")
        .map(Number);
        
      if (zoom && lat && lng) {
        return { zoom, center: [lat, lng] };
      }
    } catch (e) {
      console.error("Failed to parse hash:", e);
    }
    
    return defaultState;
  };
  
  return { updateMapHash, getInitialMapState };
}

// Separate component for hash management
function HashManager() {
  const map = useMap();
  const { updateMapHash } = useMapHash();

  useEffect(() => {
    const onMoveEnd = () => updateMapHash(map);
    map.on("moveend", onMoveEnd);
    return () => {
      map.off("moveend", onMoveEnd);
    };
  }, [map, updateMapHash]);

  return null;
}

// Create a map configuration object that can be extended without modifying the App component
const defaultMapConfig = {
  tileLayer: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  options: {
    zoomControl: false,
    scrollWheelZoom: true,
  },
  style: { 
    height: "100vh", 
    width: "100vw" 
  }
};

// Create a MapContext to provide map state and functions
const MapContext = React.createContext();

function MapProvider({ children, initialState }) {
  const [mapState, setMapState] = useState(initialState);
  const mapRef = useRef(null);
  
  const setMapReference = (map) => {
    mapRef.current = map;
  };
  
  const value = {
    mapState,
    setMapState,
    mapRef,
    setMapReference
  };
  
  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
}

function useMapContext() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMapContext must be used within a MapProvider");
  }
  return context;
}

function App() {
  const { getInitialMapState } = useMapHash();
  const initialMapState = getInitialMapState();
  
  return (
    <MapProvider initialState={initialMapState}>
      <MapView />
    </MapProvider>
  );
}

function MapView() {
  const { mapState } = useMapContext();
  
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
      <HashManager />
      <PWABadge />
      <Layers />
      <LiveLocationToggle />
    </MapContainer>
  );
}

export default App;
