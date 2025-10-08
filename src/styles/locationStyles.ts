import type { CSSProperties } from 'react';

export const styles = {
  toggleButton: {
    border: "none",
    cursor: "pointer",
    position: "absolute",
    bottom: "20px",
    right: "20px",
    zIndex: 1000,
    padding: "8px",
    borderRadius: "50%",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
  },
  buttonIcon: {
    transition: "all 0.3s ease",
    display: "block",
  },
  pulseContainer: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
  },
} as const satisfies Record<string, CSSProperties>;
