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
        const zoom = Number(parts[0]);
        const latitude = Number(parts[1]);
        const longitude = Number(parts[2]);

        if (Number.isFinite(zoom) && Number.isFinite(latitude) && Number.isFinite(longitude)) {
            return {
                zoom: zoom as number,
                center: [latitude as number, longitude as number],
            };
        }
    } catch (error) {
        console.error("Failed to parse hash:", error);
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
