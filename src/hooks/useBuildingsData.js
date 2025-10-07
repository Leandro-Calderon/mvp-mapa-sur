import { useEffect, useState } from "react";

const BUILDINGS_PATH = "assets/fonavi.geojson";

const buildResourceUrl = (assetPath) => {
    const trimmedPath = assetPath.startsWith("/") ? assetPath.slice(1) : assetPath;
    return `${import.meta.env.BASE_URL}${trimmedPath}`;
};

export const useBuildingsData = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            try {
                const resourceUrl = buildResourceUrl(BUILDINGS_PATH);
                const response = await fetch(resourceUrl);

                if (!response.ok) {
                    throw new Error(`Failed to load buildings GeoJSON: ${response.status}`);
                }

                const geojson = await response.json();

                if (!isMounted) {
                    return;
                }

                setData(Array.isArray(geojson.features) ? geojson.features : []);
            } catch (loadError) {
                if (!isMounted) {
                    return;
                }

                setError(loadError);
                setData([]);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, []);

    return { data, loading, error };
};
