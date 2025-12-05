import React from 'react';

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

export const FonaviLegend = ({ isVisible, onClose }: FonaviLegendProps) => {
  if (!isVisible) return null;

  const tipos = ['Bloque', 'Torre', 'Departamento'];

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '20px',
      backgroundColor: 'white',
      padding: '12px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      zIndex: 1000,
      fontSize: '12px',
      minWidth: '150px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <strong style={{ fontSize: '14px' }}>Tipos FONAVI</strong>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            padding: '0',
            width: '20px',
            height: '20px'
          }}
        >
          ×
        </button>
      </div>

      {tipos.map(tipo => (
        <div key={tipo} style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '6px'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: getColorByTipo(tipo),
            marginRight: '8px',
            border: '2px solid white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
          }} />
          <span>{tipo}</span>
        </div>
      ))}
    </div>
  );
};