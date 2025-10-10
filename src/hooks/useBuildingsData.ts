import { useDataService } from './useDataService';
import { GeoJsonDataService } from '../services/DataService';

// Create a singleton instance of the data service
const dataService = new GeoJsonDataService();

export const useBuildingsData = () => {
  const { buildings } = useDataService(dataService);
  return buildings;
};
