import { useEffect, useState } from 'react';
import type { DataService, DataServiceResult } from '../services/DataService';
import type { BuildingFeature, StreetFeature } from '../types/geojson';

export const useDataService = (service: DataService) => {
  const [buildingsResult, setBuildingsResult] = useState<DataServiceResult<BuildingFeature[]>>({
    data: [],
    loading: true,
    error: null
  });

  const [streetsResult, setStreetsResult] = useState<DataServiceResult<StreetFeature[]>>({
    data: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      // Load buildings
      try {
        setBuildingsResult(prev => ({ ...prev, loading: true, error: null }));
        const buildings = await service.loadBuildings();
        if (isMounted) {
          setBuildingsResult({ data: buildings, loading: false, error: null });
        }
      } catch (error) {
        if (isMounted) {
          setBuildingsResult({
            data: [],
            loading: false,
            error: error instanceof Error ? error : new Error('Unknown error')
          });
        }
      }

      // Load streets
      try {
        setStreetsResult(prev => ({ ...prev, loading: true, error: null }));
        const streets = await service.loadStreets();
        if (isMounted) {
          setStreetsResult({ data: streets, loading: false, error: null });
        }
      } catch (error) {
        if (isMounted) {
          setStreetsResult({
            data: [],
            loading: false,
            error: error instanceof Error ? error : new Error('Unknown error')
          });
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [service]);

  return {
    buildings: buildingsResult,
    streets: streetsResult
  };
};
