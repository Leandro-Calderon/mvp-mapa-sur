import { useState } from "react";
import "./LocationButton.css";

interface LocationButtonProps {
  onToggle: (active: boolean) => void;
  isActive?: boolean;
}

export const LocationButton = ({ onToggle, isActive = false }: LocationButtonProps) => {
  const [active, setActive] = useState(isActive);

  const handleClick = () => {
    const newActive = !active;
    setActive(newActive);
    onToggle(newActive);
  };

  const buttonClassName = [
    "location-btn",
    active ? "active" : "idle",
  ].join(" ");

  return (
    <button
      className={buttonClassName}
      onClick={handleClick}
      aria-label={active ? "Desactivar ubicación" : "Activar ubicación"}
    >
      <div className="location-icon">📍</div>
    </button>
  );
};
