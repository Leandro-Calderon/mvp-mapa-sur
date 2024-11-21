// LiveLocationToggle.jsx
import { useMap, Marker } from 'react-leaflet';
import { useState } from 'react';

function LiveLocationToggle() {
  const [position, setPosition] = useState(null);
  const [isLiveLocationActive, setIsLiveLocationActive] = useState(false);
  const [watchId, setWatchId] = useState(null); // ID de la geolocalización
  const map = useMap();

  // Función para activar/desactivar la geolocalización en vivo
  const toggleLiveLocation = () => {
    if (isLiveLocationActive) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setPosition(null);
    } else {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition([latitude, longitude]);
          map.flyTo([latitude, longitude], 16); // Mover el mapa hacia la nueva ubicación
        },
        (err) => console.error(err),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
      setWatchId(id); // Guardar el ID del watch para poder detenerlo después
    }
    setIsLiveLocationActive(!isLiveLocationActive);
  };

  return (
    <>
      <button
        onClick={toggleLiveLocation}
        style={{
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          zIndex: 1000,
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="48"
          height="48"
          fill={isLiveLocationActive ? 'green' : 'red'}
        >
          <circle cx="12" cy="12" r="10" />
        </svg>
      </button>

      {position && (
        <Marker position={position}>
          {/* Aquí puedes personalizar el ícono del marcador */}
        </Marker>
      )}
    </>
  );
}

export default LiveLocationToggle;  // Exportación por defecto
