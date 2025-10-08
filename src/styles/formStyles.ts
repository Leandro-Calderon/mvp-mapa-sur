import type { CSSProperties } from 'react';

// Type definitions for form styles
export const styles = {
  searchForm: {
    padding: "5px",
    borderRadius: "4px",
    marginBottom: "0",
    width: "40%",
  },
  input: {
    width: "80%",
    padding: "5px",
    margin: "0",
    borderRadius: "3px",
    border: "1px solid #ccc",
  },
  checkboxContainer: {
    display: "flex",
    alignItems: "center",
    padding: "5px 0",
    marginTop: "5px",
  },
  checkbox: {
    width: "auto",
    margin: "0 8px 0 0",
    cursor: "pointer",
  },
  checkboxLabel: {
    fontSize: "14px",
    cursor: "pointer",
    userSelect: "none",
    color: "#073b91",
  },
} as const satisfies Record<string, CSSProperties>;
