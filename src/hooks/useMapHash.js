const DEFAULT_CENTER = [-32.93968, -60.66904];
const DEFAULT_ZOOM = 12;

const buildHash = (zoom, latitude, longitude) => `#map=${zoom}/${latitude.toFixed(5)}/${longitude.toFixed(5)}`;

const parseHash = (hashValue) => {
    if (!hashValue.startsWith("#map=")) {
        return null;
    }

    try {
        const [zoom, latitude, longitude] = hashValue.replace("#map=", "").split("/").map(Number);

        if (Number.isFinite(zoom) && Number.isFinite(latitude) && Number.isFinite(longitude)) {
            return {
                zoom,
                center: [latitude, longitude],
            };
        }
    } catch (error) {
        console.error("Failed to parse hash:", error);
    }

    return null;
};

export const useMapHash = () => {
    const updateMapHash = (mapInstance) => {
        const zoom = mapInstance.getZoom();
        const center = mapInstance.getCenter();
        const { lat, lng } = center;

        window.location.hash = buildHash(zoom, lat, lng);
    };

    const getInitialMapState = () => {
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
