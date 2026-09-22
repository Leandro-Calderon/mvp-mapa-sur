import styles from "./MapNotifications.module.css";

interface MapNotificationsProps {
  isLoading: boolean;
  hasError: boolean;
}

export const MapNotifications = ({ isLoading, hasError }: MapNotificationsProps) => {
  if (isLoading) {
    return (
      <div className={styles.loadingIndicator} role="status" aria-live="polite">
        Cargando capas…
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={styles.errorIndicator} role="alert">
        Error al cargar datos geoespaciales. Intenta recargar la página.
      </div>
    );
  }

  return null;
};
