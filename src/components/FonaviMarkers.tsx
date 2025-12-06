import { CircleMarker, Popup, Tooltip } from "react-leaflet";
import type { BuildingFeature } from "../types/geojson";
import "../styles/FonaviMarkers.css";
import { logger } from "../utils/logger";

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

// Función para obtener el radio según el tipo
const getRadiusByTipo = (tipo: string): number => {
  switch (tipo) {
    case 'Bloque':
      return 8;
    case 'Torre':
      return 10; // Más grande para torres
    case 'Departamento':
      return 6; // Más pequeño para departamentos
    default:
      return 7;
  }
};

interface FonaviMarkersProps {
  features: BuildingFeature[];
}

export const FonaviMarkers = ({ features }: FonaviMarkersProps) => {
  logger.debug('FonaviMarkers: Rendering features', { count: features.length });

  return (
    <>
      {features.map((feature, index) => {
        const { tipo, nombre, plan } = feature.properties;
        const [lng, lat] = feature.geometry.coordinates;

        const color = getColorByTipo(tipo);
        const radius = getRadiusByTipo(tipo);

        return (
          <CircleMarker
            key={`fonavi-${index}`}
            center={[lat, lng]}
            radius={radius}
            pathOptions={{
              color: color,
              fillColor: color,
              fillOpacity: 0.7,
              weight: 2,
              className: `fonavi-marker fonavi-${tipo.toLowerCase()}`
            }}
          >
            <Tooltip permanent={false} direction="top" opacity={0.9}>
              <div style={{
                textAlign: 'center',
                fontSize: '12px',
                lineHeight: '1.2'
              }}>
                <strong style={{ color }}>{tipo}</strong>
                {nombre && <div>N°: {nombre}</div>}
                {plan && <div>Plan: {plan}</div>}
              </div>
            </Tooltip>

            <Popup maxWidth={250}>
              <div style={{
                textAlign: 'center',
                padding: '8px'
              }}>
                <h4 style={{
                  margin: '0 0 8px 0',
                  color: color,
                  fontSize: '16px'
                }}>
                  {tipo}
                </h4>
                {nombre && (
                  <p style={{ margin: '4px 0', fontSize: '14px' }}>
                    <strong>Número:</strong> {nombre}
                  </p>
                )}
                {plan && (
                  <p style={{ margin: '4px 0', fontSize: '14px' }}>
                    <strong>Plan:</strong> {plan}
                  </p>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
};