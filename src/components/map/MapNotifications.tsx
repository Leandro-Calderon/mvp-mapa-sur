import React from "react";
import styles from "./MapNotifications.module.css";

interface MapNotificationsProps {
  isLoading: boolean;
  hasError: boolean;
}

export const MapNotifications = ({ isLoading, hasError }: MapNotificationsProps) => {
  if (isLoading) {
    return (
      <div className={styles.loadingIndicator}>
        Cargando capas…
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={styles.errorIndicator}>
        Error al cargar datos geoespaciales. Intenta recargar la página.
      </div>
    );
  }

  return null;
};
