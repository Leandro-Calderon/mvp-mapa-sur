import { useCallback } from 'react';
import type { PopupInfo } from '../../types/map';
import { logger } from '../../utils/logger';
import styles from './MapPopup.module.css';

interface MapPopupContentProps {
  popupInfo: PopupInfo;
}

/** Color class for building type badge */
const getTypeClass = (tipo: string): string => {
  switch (tipo) {
    case 'Bloque': return styles.typeBloque!;
    case 'Torre': return styles.typeTorre!;
    case 'Departamento': return styles.typeDepartamento!;
    default: return styles.typeDefault!;
  }
};

export const MapPopupContent = ({ popupInfo }: MapPopupContentProps) => {
  const { properties, longitude, latitude } = popupInfo;
  const isBuilding = popupInfo.layerId === 'unclustered-point';

  const tipo = String(properties.tipo ?? '');
  const nombre = properties.nombre ? String(properties.nombre) : null;
  const plan = properties.plan ? String(properties.plan) : null;

  const handleShare = useCallback(async () => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const title = isBuilding
      ? `${tipo} ${nombre ?? ''} - FONAVI`
      : String(nombre ?? tipo);

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (err) {
        if ((err as DOMException).name === 'AbortError') return;
        logger.warn('MapPopup: Share failed, falling back to clipboard', err);
      }
    }

    // Fallback: copy URL to clipboard
    try {
      await navigator.clipboard.writeText(url);
    } catch (err) {
      logger.error('MapPopup: Clipboard fallback failed', err);
    }
  }, [isBuilding, tipo, nombre, latitude, longitude]);

  const handleDirections = useCallback(() => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(url, '_blank', 'noopener');
  }, [latitude, longitude]);

  // ─── Render ─────────────────────────────────────────────

  return (
    <div className={styles.popup}>
      {isBuilding ? (
        // Building: badge + number + plan (no repeated "Número:" row)
        <div className={styles.header}>
          <span className={`${styles.typeBadge} ${getTypeClass(tipo)}`}>
            {tipo}
          </span>
          {nombre && <span className={styles.title}>{nombre}</span>}
          {plan && (
            <span className={styles.planBadge}>Plan {plan}</span>
          )}
        </div>
      ) : (
        // Street: name + type
        <div>
          <p className={styles.streetName}>{nombre ?? 'Sin nombre'}</p>
          <p className={styles.streetType}>{tipo}</p>
        </div>
      )}

      <div className={styles.actions}>
        <button
          className={styles.actionBtn!}
          onClick={handleShare}
          title="Compartir ubicación"
        >
          <span className={styles.actionIcon!}>🔗</span>
          <span className={styles.actionLabel!}>Compartir</span>
        </button>

        <button
          className={styles.actionBtn!}
          onClick={handleDirections}
          title="Cómo llegar"
        >
          <span className={styles.actionIcon!}>🧭</span>
          <span className={styles.actionLabel!}>Cómo llegar</span>
        </button>
      </div>
    </div>
  );
};
