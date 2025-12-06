import React, { memo, useMemo } from "react";
import { CircleMarker, Popup, Tooltip } from "react-leaflet";
import type { BuildingFeature } from "../types/geojson";
import "../styles/FonaviMarkers.css";
import { logger } from "../utils/logger";

// Color map for faster lookup
const COLOR_MAP: Record<string, string> = {
  'Bloque': '#FF6B6B',      // Rojo suave
  'Torre': '#4ECDC4',       // Turquesa
  'Departamento': '#45B7D1', // Azul
};
const DEFAULT_COLOR = '#95A5A6'; // Gris para tipos desconocidos

// Radius map for faster lookup
const RADIUS_MAP: Record<string, number> = {
  'Bloque': 8,
  'Torre': 10,        // Más grande para torres
  'Departamento': 6,  // Más pequeño para departamentos
};
const DEFAULT_RADIUS = 7;

// Extracted styles as constants to avoid recreation on each render
const TOOLTIP_STYLE: React.CSSProperties = {
  textAlign: 'center',
  fontSize: '12px',
  lineHeight: '1.2'
};

const POPUP_CONTAINER_STYLE: React.CSSProperties = {
  textAlign: 'center',
  padding: '8px'
};

const POPUP_TITLE_BASE_STYLE: React.CSSProperties = {
  margin: '0 0 8px 0',
  fontSize: '16px'
};

const POPUP_TEXT_STYLE: React.CSSProperties = {
  margin: '4px 0',
  fontSize: '14px'
};

// Función para obtener el color según el tipo
const getColorByTipo = (tipo: string): string => COLOR_MAP[tipo] || DEFAULT_COLOR;

// Función para obtener el radio según el tipo
const getRadiusByTipo = (tipo: string): number => RADIUS_MAP[tipo] || DEFAULT_RADIUS;

// Generate a stable unique key for a feature
const getFeatureKey = (feature: BuildingFeature, index: number): string => {
  const { tipo, nombre, plan } = feature.properties;
  const [lng, lat] = feature.geometry.coordinates;
  // Create a unique key based on properties and coordinates
  return `fonavi-${tipo}-${nombre ?? 'unknown'}-${lat.toFixed(5)}-${lng.toFixed(5)}-${index}`;
};

interface FonaviMarkersProps {
  features: BuildingFeature[];
}

// Memoized single marker component
const FonaviMarker = memo(({ feature, index }: { feature: BuildingFeature; index: number }) => {
  const { tipo, nombre, plan } = feature.properties;
  const [lng, lat] = feature.geometry.coordinates;

  const color = getColorByTipo(tipo);
  const radius = getRadiusByTipo(tipo);
  const key = getFeatureKey(feature, index);

  // Memoize pathOptions to avoid recreation
  const pathOptions = useMemo(() => ({
    color: color,
    fillColor: color,
    fillOpacity: 0.7,
    weight: 2,
    className: `fonavi-marker fonavi-${tipo.toLowerCase()}`
  }), [color, tipo]);

  // Memoize title style with color
  const titleStyle = useMemo(() => ({
    ...POPUP_TITLE_BASE_STYLE,
    color: color
  }), [color]);

  return (
    <CircleMarker
      key={key}
      center={[lat, lng]}
      radius={radius}
      pathOptions={pathOptions}
    >
      <Tooltip permanent={false} direction="top" opacity={0.9}>
        <div style={TOOLTIP_STYLE}>
          <strong style={{ color }}>{tipo}</strong>
          {nombre && <div>N°: {nombre}</div>}
          {plan && <div>Plan: {plan}</div>}
        </div>
      </Tooltip>

      <Popup maxWidth={250}>
        <div style={POPUP_CONTAINER_STYLE}>
          <h4 style={titleStyle}>
            {tipo}
          </h4>
          {nombre && (
            <p style={POPUP_TEXT_STYLE}>
              <strong>Número:</strong> {nombre}
            </p>
          )}
          {plan && (
            <p style={POPUP_TEXT_STYLE}>
              <strong>Plan:</strong> {plan}
            </p>
          )}
        </div>
      </Popup>
    </CircleMarker>
  );
});

FonaviMarker.displayName = 'FonaviMarker';

export const FonaviMarkers = memo(({ features }: FonaviMarkersProps) => {
  logger.debug('FonaviMarkers: Rendering features', { count: features.length });

  return (
    <>
      {features.map((feature, index) => (
        <FonaviMarker
          key={getFeatureKey(feature, index)}
          feature={feature}
          index={index}
        />
      ))}
    </>
  );
});

FonaviMarkers.displayName = 'FonaviMarkers';