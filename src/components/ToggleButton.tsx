import { styles } from "../styles/locationStyles";

interface ToggleButtonProps {
  isActive: boolean;
  onClick: () => void;
}

export const ToggleButton = ({ isActive, onClick }: ToggleButtonProps) => (
  <button
    onClick={onClick}
    style={{
      ...styles.toggleButton,
      backgroundColor: isActive ? "rgba(59, 130, 246, 0.15)" : "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(10px)",
      boxShadow: isActive
        ? "0 4px 12px rgba(59, 130, 246, 0.4), 0 0 0 2px rgba(59, 130, 246, 0.3)"
        : "0 2px 8px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.08)",
    }}
    aria-label={isActive ? "Desactivar seguimiento de ubicación" : "Activar seguimiento de ubicación"}
    title={isActive ? "Ubicación activa - Click para desactivar" : "Click para activar mi ubicación"}
  >
    <div style={isActive ? styles.pulseContainer : { display: "flex" }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke={isActive ? "#3b82f6" : "#6b7280"}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={styles.buttonIcon}
      >
        {/* GPS/Location crosshair icon */}
        <circle cx="12" cy="12" r="3" fill={isActive ? "#3b82f6" : "#6b7280"} />
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="2" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="22" y2="12" />
      </svg>
    </div>
  </button>
);
