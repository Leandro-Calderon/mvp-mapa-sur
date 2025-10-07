import { useEffect, useState } from "react";
import type { BuildingFeature } from "../types/geojson";

const BUILDINGS_PATH = "assets/fonavi.geojson";

const buildResourceUrl = (assetPath: string): string => {
  const trimmedPath = assetPath.startsWith("/") ? assetPath.slice(1) : assetPath;
  return `${import.meta.env.BASE_URL}${trimmedPath}`;
};

interface BuildingsDataResult {
  data: BuildingFeature[];
  loading: boolean;
  error: Error | null;
}

export const useBuildingsData = (): BuildingsDataResult => {
  const [data, setData] = useState<BuildingFeature[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async (): Promise<void> => {
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

        setError(loadError as Error);
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
