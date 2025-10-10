import type { MapState, LatLngArray, MapInstance } from "../types/map";

const DEFAULT_CENTER: LatLngArray = [-32.93968, -60.66904];
const DEFAULT_ZOOM = 12;

const buildHash = (zoom: number, latitude: number, longitude: number): string =>
  `#map=${zoom}/${latitude.toFixed(5)}/${longitude.toFixed(5)}`;

const parseHash = (hashValue: string): MapState | null => {
    if (!hashValue.startsWith("#map=")) {
        return null;
    }

    try {
        const parts = hashValue.replace("#map=", "").split("/");
        if (parts.length !== 3) return null;
        
        const zoom = Number(parts[0]);
        const latitude = Number(parts[1]);
        const longitude = Number(parts[2]);

        // Validate ranges to prevent injection attacks
        if (!Number.isFinite(zoom) || zoom < 1 || zoom > 20) return null;
        if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return null;
        if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return null;

        return {
            zoom: zoom as number,
            center: [latitude as number, longitude as number],
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
    const updateMapHash = (mapInstance: MapInstance) => {
        const zoom = mapInstance.getZoom();
        const center = mapInstance.getCenter();
        const { lat, lng } = center;

        window.location.hash = buildHash(zoom, lat, lng);
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
