import { styles } from "../styles/locationStyles";

export const ToggleButton = ({ isActive, onClick }) => (
  <button
    onClick={onClick}
    style={styles.toggleButton}
    aria-label={isActive ? "Stop tracking location" : "Start tracking location"}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="48"
      height="48"
      fill={isActive ? "green" : "red"}
      style={styles.buttonIcon}
    >
      <circle cx="12" cy="12" r="10" />
    </svg>
  </button>
);
