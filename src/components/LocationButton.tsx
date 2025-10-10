import { useState } from "react";
import "./LocationButton.css";

interface LocationButtonProps {
  onToggle: (active: boolean) => void;
  isActive?: boolean;
  isTracking?: boolean;
  hasError?: boolean;
}

export const LocationButton = ({
  onToggle,
  isActive = false,
  isTracking = false,
  hasError = false
}: LocationButtonProps) => {
  const [active, setActive] = useState(isActive);

  const handleClick = () => {
    console.log('Location button clicked, current state:', active);
    const newActive = !active;
    console.log('Location button new state:', newActive);
    setActive(newActive);
    onToggle(newActive);
  };

  const buttonClassName = [
    "location-btn",
    active ? "active" : "idle",
    hasError ? "error" : "",
  ].join(" ");

  return (
    <button
      className={buttonClassName}
      onClick={handleClick}
      aria-label={
        hasError
          ? "Error de ubicación"
          : active
            ? "Desactivar ubicación"
            : "Activar ubicación"
      }
      title={
        hasError
          ? "Error al obtener la ubicación"
          : active
            ? "Desactivar seguimiento de ubicación"
            : "Activar seguimiento de ubicación"
      }
    >
      <div className="location-icon">📍</div>
    </button>
  );
};
