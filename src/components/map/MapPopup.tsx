import { useState, useCallback } from 'react';
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

/** Color hex for building type (used in badge) */
const TYPE_COLORS: Record<string, string> = {
  Bloque: '#FF6B6B',
  Torre: '#4ECDC4',
  Departamento: '#45B7D1',
};

export const MapPopupContent = ({ popupInfo }: MapPopupContentProps) => {
  const [copied, setCopied] = useState(false);
  const { properties, longitude, latitude } = popupInfo;
  const isBuilding = popupInfo.layerId === 'unclustered-point';

  const tipo = String(properties.tipo ?? '');
  const nombre = properties.nombre ? String(properties.nombre) : null;
  const plan = properties.plan ? String(properties.plan) : null;
  const coordsText = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

  // ─── Actions ────────────────────────────────────────────

  const handleCopy = useCallback(async () => {
    try {
      const text = isBuilding
        ? `${tipo} ${nombre ?? ''} (Plan ${plan ?? '-'}) — ${coordsText}`
        : `${nombre ?? tipo} — ${coordsText}`;

      await navigator.clipboard.writeText(text.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      logger.error('MapPopup: Failed to copy', err);
    }
  }, [isBuilding, tipo, nombre, plan, coordsText]);

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
        // User cancelled — not an error
        if ((err as DOMException).name === 'AbortError') return;
        logger.warn('MapPopup: Share failed, falling back to clipboard', err);
      }
    }

    // Fallback: copy URL to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
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
        <BuildingHeader tipo={tipo} nombre={nombre} />
      ) : (
        <StreetHeader nombre={nombre} tipo={tipo} />
      )}

      {isBuilding && (
        <div className={styles.details}>
          {nombre && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Número:</span>
              <span className={styles.detailValue}>{nombre}</span>
            </div>
          )}
          {plan && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Plan:</span>
              <span className={styles.detailValue}>{plan}</span>
            </div>
          )}
        </div>
      )}

      <div className={styles.coordinates}>{coordsText}</div>

      <div className={styles.actions}>
        <button
          className={`${styles.actionBtn} ${copied ? styles.copied : ''}`}
          onClick={handleCopy}
          title="Copiar ubicación"
        >
          <span className={styles.actionIcon}>{copied ? '✅' : '📍'}</span>
          <span className={styles.actionLabel}>{copied ? 'Copiado' : 'Copiar'}</span>
        </button>

        <button
          className={styles.actionBtn}
          onClick={handleShare}
          title="Compartir ubicación"
        >
          <span className={styles.actionIcon}>🔗</span>
          <span className={styles.actionLabel}>Compartir</span>
        </button>

        <button
          className={styles.actionBtn}
          onClick={handleDirections}
          title="Cómo llegar"
        >
          <span className={styles.actionIcon}>🧭</span>
          <span className={styles.actionLabel}>Cómo llegar</span>
        </button>
      </div>
    </div>
  );
};

// ─── Sub-components ──────────────────────────────────────────

function BuildingHeader({ tipo, nombre }: { tipo: string; nombre: string | null }) {
  return (
    <div className={styles.header}>
      <span className={`${styles.typeBadge} ${getTypeClass(tipo)}`}>
        {tipo}
      </span>
      {nombre && <span className={styles.title}>{nombre}</span>}
    </div>
  );
}

function StreetHeader({ nombre, tipo }: { nombre: string | null; tipo: string }) {
  return (
    <div>
      <p className={styles.streetName}>{nombre ?? 'Sin nombre'}</p>
      <p className={styles.streetType}>{tipo}</p>
    </div>
  );
}
