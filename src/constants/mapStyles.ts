import type { MapStyleConfig, MapStyleId } from '../types/map';

// OpenFreeMap and custom styles
export const MAP_STYLES: Record<MapStyleId, MapStyleConfig> = {
    liberty: {
        id: 'liberty',
        name: 'Claro',
        url: '/mvp-mapa-sur/styles/liberty.json',
    },
    dark: {
        id: 'dark',
        name: 'Oscuro',
        url: '/mvp-mapa-sur/styles/dark.json',
    },
    satellite: {
        id: 'satellite',
        name: 'Satélite',
        // Local JSON style file for Esri World Imagery satellite tiles
        // Note: must include base path from vite.config.js
        url: '/mvp-mapa-sur/styles/satellite.json',
    },
};

// Default style
export const DEFAULT_STYLE: MapStyleId = 'liberty';

// Helper to get style URL
export const getStyleUrl = (styleId: MapStyleId): string => {
    return MAP_STYLES[styleId]?.url ?? MAP_STYLES.liberty.url;
};

// All available styles for UI picker
export const AVAILABLE_STYLES = Object.values(MAP_STYLES);

// Attribution for each style
export const MAP_ATTRIBUTIONS = {
    liberty: '© <a href="https://openfreemap.org">OpenFreeMap</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    dark: '© <a href="https://openfreemap.org">OpenFreeMap</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    satellite: '© <a href="https://www.ign.gob.ar">IGN Argentina</a>',
};
