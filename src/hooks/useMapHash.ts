import type { MapState, LngLatArray } from "../types/map";

const DEFAULT_CENTER: LngLatArray = [-60.66904, -32.93968]; // [lng, lat] - Rosario, Santa Fe
const DEFAULT_ZOOM = 12;

// Build hash from map state (format: #map=zoom/lng/lat)
const buildHash = (zoom: number, longitude: number, latitude: number): string =>
    `#map=${zoom}/${longitude.toFixed(5)}/${latitude.toFixed(5)}`;

// Parse hash to map state
const parseHash = (hashValue: string): MapState | null => {
    if (!hashValue.startsWith("#map=")) {
        return null;
    }

    try {
        const parts = hashValue.replace("#map=", "").split("/");
        if (parts.length !== 3) return null;

        const zoom = Number(parts[0]);
        const longitude = Number(parts[1]);
        const latitude = Number(parts[2]);

        // Validate ranges to prevent injection attacks
        if (!Number.isFinite(zoom) || zoom < 1 || zoom > 20) return null;
        if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return null;
        if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return null;

        return {
            zoom,
            center: [longitude, latitude],
        };
    } catch (error) {
        // Log error in development only
        if (import.meta.env.DEV) {
            console.error("Failed to parse hash:", error);
        }
    }

    return null;
};

export const useMapHash = () => {
    const updateMapHash = (longitude: number, latitude: number, zoom: number) => {
        window.location.hash = buildHash(zoom, longitude, latitude);
    };

    const getInitialMapState = (): MapState => {
        if (!window.location.hash) {
            return {
                zoom: DEFAULT_ZOOM,
                center: DEFAULT_CENTER,
            };
        }

        const parsedState = parseHash(window.location.hash);

        if (parsedState) {
            return parsedState;
        }

        return {
            zoom: DEFAULT_ZOOM,
            center: DEFAULT_CENTER,
        };
    };

    return { updateMapHash, getInitialMapState };
};

// Export for use in context
export { DEFAULT_CENTER, DEFAULT_ZOOM };
