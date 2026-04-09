import { memo, useState } from 'react';
import styles from './FonaviLegend.module.css';

// Función para obtener el color según el tipo
const getColorByTipo = (tipo: string): string => {
  switch (tipo) {
    case 'Bloque':
      return '#FF6B6B'; // Rojo suave
    case 'Torre':
      return '#4ECDC4'; // Turquesa
    case 'Departamento':
      return '#45B7D1'; // Azul
    default:
      return '#95A5A6'; // Gris para tipos desconocidos
  }
};

interface FonaviLegendProps {
  isVisible: boolean;
  onClose: () => void;
}

const TIPOS = ['Bloque', 'Torre', 'Departamento'];

export const FonaviLegend = memo(({ isVisible, onClose }: FonaviLegendProps) => {
  // Track whether the user dismissed the legend this session
  const [dismissed, setDismissed] = useState(false);

  if (!isVisible) return null;

  // User closed the legend — show reopen button
  if (dismissed) {
    return (
      <button
        className={styles.reopenBtn!}
        onClick={() => setDismissed(false)}
        title="Mostrar leyenda"
        aria-label="Mostrar leyenda de tipos FONAVI"
      >
        ℹ️
      </button>
    );
  }

  return (
    <div className={styles.legend}>
      <div className={styles.header}>
        <strong className={styles.title}>Tipos FONAVI</strong>
        <button
          className={styles.closeBtn!}
          onClick={() => {
            setDismissed(true);
            onClose();
          }}
          aria-label="Cerrar leyenda"
        >
          ×
        </button>
      </div>

      {TIPOS.map(tipo => (
        <div key={tipo} className={styles.item}>
          <div
            className={styles.dot!}
            style={{ backgroundColor: getColorByTipo(tipo) }}
          />
          <span>{tipo}</span>
        </div>
      ))}
    </div>
  );
});

FonaviLegend.displayName = 'FonaviLegend';
